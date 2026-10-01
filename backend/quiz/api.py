"""
Koozy REST API — used by the React multiplayer game UI.

Endpoints
---------
GET  /api/auth/me/                     → current authenticated host profile info
GET  /api/sessions/<pin>/state/       → session status, global timer, questions (all unlocked), and participant state
POST /api/sessions/<pin>/submit/      → batch submit complete quiz answers at once
POST /api/sessions/<pin>/answer/      → single question answer (backward-compatible)
POST /api/sessions/<pin>/start/       → host starts the entire quiz
POST /api/sessions/<pin>/end/         → host ends the quiz early
POST /api/sessions/<pin>/kick/        → host removes a participant
POST /api/sessions/<pin>/admit/       → host admits a participant
GET  /api/sessions/<pin>/leaderboard/ → ranked participant list
GET  /api/sessions/<pin>/result/      → full results for requesting participant
GET  /api/sessions/<pin>/host-result/ → full host leaderboard
"""

import json
import secrets

from django.db import IntegrityError, transaction
from django.db.models import F
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import AnswerSubmission, HostProfile, LiveSession, Participant, Question, Quiz
from .realtime import (
    maybe_close_question,
    maybe_complete_quiz,
    publish_lobby_state,
    publish_participant_admitted,
    publish_participant_kicked,
    publish_quiz_complete,
    publish_quiz_start,
    publish_submission_update,
)

POINTS_CORRECT = 1000
POINTS_INCORRECT = 0


# ---------------------------------------------------------------------------
# Auth state helper
# ---------------------------------------------------------------------------

@api_view(["GET"])
@ensure_csrf_cookie
def api_auth_me(request):
    """Returns current host user and profile data."""
    if not request.user.is_authenticated:
        return Response({"is_authenticated": False, "user": None})

    avatar_url = ""
    profile = getattr(request.user, "host_profile", None)
    if profile:
        avatar_url = profile.avatar_url or ""

    return Response({
        "is_authenticated": True,
        "user": {
            "is_authenticated": True,
            "name": request.user.first_name or request.user.username,
            "email": request.user.email,
            "avatar_url": avatar_url,
        }
    })


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _participant_cookie_name(live_session):
    return f"kz_pt_{live_session.id}"


def _get_participant(request, live_session):
    """
    Resolve requesting participant with priority:
    1. X-Participant-Token HTTP header
    2. ?pt= query parameter
    3. Cookie kz_pt_<session_id> (fallback)
    """
    token = (
        request.headers.get("X-Participant-Token")
        or request.GET.get("pt")
        or request.COOKIES.get(_participant_cookie_name(live_session))
    )
    if not token:
        return None
    return Participant.objects.filter(
        join_token=token, live_session=live_session
    ).first()


def _leaderboard_data(live_session):
    participants = list(
        live_session.participants.filter(is_kicked=False, is_admitted=True)
        .order_by("-score", "joined_at")
        .values("id", "display_name", "score", "submitted_at")
    )
    for rank, p in enumerate(participants, start=1):
        p["rank"] = rank
        p["has_submitted"] = bool(p.get("submitted_at"))
    return participants


# ---------------------------------------------------------------------------
# GET /api/sessions/<pin>/state/
# ---------------------------------------------------------------------------

@api_view(["GET"])
def session_state(request, game_pin):
    """
    Returns current session + global timer + questions + participant state.
    Safe: correct_answer is never exposed to unsubmitted participants during ACTIVE quiz.
    """
    ls = LiveSession.objects.filter(game_pin=game_pin.upper()).first()
    if ls is None:
        return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

    # Auto-close / auto-complete if timer expired
    if ls.status == LiveSession.Status.ACTIVE and not ls.current_question_closed:
        maybe_close_question(ls)
        ls.refresh_from_db()

    if ls.status == LiveSession.Status.ACTIVE and ls.seconds_remaining() <= 0:
        maybe_complete_quiz(ls)
        ls.refresh_from_db()

    questions = list(ls.quiz.questions.order_by("order", "id"))
    total = len(questions)
    participant = _get_participant(request, ls)
    current_q = ls.current_question()

    # Participant state
    participant_data = None
    submitted_answers_map = {}

    if participant is not None:
        subs = list(AnswerSubmission.objects.filter(participant=participant))
        for s in subs:
            submitted_answers_map[s.question_id] = s.selected_option

        submitted_opt = None
        if current_q is not None:
            sub = next((s for s in subs if s.question_id == current_q.id), None)
            if sub:
                submitted_opt = sub.selected_option
        elif len(subs) > 0:
            submitted_opt = subs[0].selected_option

        score_to_show = participant.score
        if not ls.current_question_closed and ls.status == LiveSession.Status.ACTIVE and current_q is not None and participant.submitted_at is None:
            if sub is not None:
                score_to_show = max(0, participant.score - sub.points_awarded)

        participant_data = {
            "id": participant.id,
            "display_name": participant.display_name,
            "score": score_to_show,
            "is_kicked": participant.is_kicked,
            "is_admitted": getattr(participant, "is_admitted", True),
            "submitted_at": participant.submitted_at.isoformat() if participant.submitted_at else None,
            "has_submitted": bool(participant.submitted_at),
            "submitted_option": submitted_opt,
            "submitted_answers": submitted_answers_map,
        }

    # Questions payload (unlocked when ACTIVE or COMPLETED)
    questions_data = None
    if ls.status in (LiveSession.Status.ACTIVE, LiveSession.Status.COMPLETED):
        can_see_correct = (
            ls.status == LiveSession.Status.COMPLETED
            or ls.current_question_closed
            or (participant is not None and participant.submitted_at is not None)
            or (request.user.is_authenticated and ls.quiz.author_id == request.user.id)
        )
        questions_data = []
        for idx, q in enumerate(questions):
            q_dict = {
                "id": q.id,
                "question_index": idx,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
                "time_limit": q.time_limit,
            }
            if can_see_correct:
                q_dict["correct_answer"] = q.correct_answer
            questions_data.append(q_dict)

    # Single active question helper for backward compatibility
    current_q_payload = None
    if current_q is not None and questions_data:
        current_q_payload = next((q for q in questions_data if q["id"] == current_q.id), questions_data[0]).copy()
        if ls.current_question_closed or ls.status == LiveSession.Status.COMPLETED:
            current_q_payload["correct_answer"] = current_q.correct_answer
    elif questions_data and len(questions_data) > 0:
        current_q_payload = questions_data[0].copy()

    distribution_data = None
    if (ls.current_question_closed or ls.status == LiveSession.Status.COMPLETED) and current_q is not None:
        dist = {"a": 0, "b": 0, "c": 0, "d": 0}
        for opt in AnswerSubmission.objects.filter(
            question=current_q,
            participant__live_session=ls,
        ).values_list("selected_option", flat=True):
            if opt in dist:
                dist[opt] += 1
        distribution_data = dist

    # Admitted participants list for host / lobby
    admitted_participants = list(
        ls.participants.filter(is_kicked=False, is_admitted=True)
        .order_by("joined_at")
        .values("id", "display_name", "submitted_at")
    )
    for p in admitted_participants:
        p["has_submitted"] = bool(p.get("submitted_at"))

    # Pending late participants waiting for host admission
    pending_participants = list(
        ls.participants.filter(is_kicked=False, is_admitted=False)
        .order_by("joined_at")
        .values("id", "display_name")
    )

    return Response(
        {
            "game_pin": ls.game_pin,
            "quiz_title": ls.quiz.title,
            "quiz_description": ls.quiz.description,
            "status": ls.status,
            "current_question_index": ls.current_question_index,
            "total_time_limit": ls.total_time_limit,
            "seconds_elapsed": round(ls.seconds_elapsed(), 2),
            "seconds_remaining": ls.seconds_remaining(),
            "quiz_started_at": ls.quiz_started_at.isoformat() if ls.quiz_started_at else None,
            "question_count": total,
            "is_quiz_open": ls.is_quiz_open(),
            "questions": questions_data,
            "question": current_q_payload,
            "distribution": distribution_data,
            "participant": participant_data,
            "participants": admitted_participants,
            "submissions_count": sum(1 for p in admitted_participants if p["has_submitted"]),
            "participant_count": len(admitted_participants),
            "pending_participants": pending_participants,
            "pending_count": len(pending_participants),
            "answer_phase_open": ls.is_answer_phase_open(),
            "question_closed": bool(ls.current_question_closed or ls.status == LiveSession.Status.COMPLETED),
        }
    )


# ---------------------------------------------------------------------------
# POST /api/sessions/<pin>/submit/  (Batch Quiz Submission)
# ---------------------------------------------------------------------------

@api_view(["POST"])
def submit_quiz_answers(request, game_pin):
    """
    Body: { "answers": { "<question_id>": "a" | "b" | "c" | "d" } }
    Submits the participant's complete answer set at once.
    """
    ls = LiveSession.objects.filter(game_pin=game_pin.upper()).first()
    if ls is None:
        return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

    participant = _get_participant(request, ls)
    if participant is None:
        return Response(
            {"detail": "You are not a participant in this session."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if ls.status not in (LiveSession.Status.ACTIVE, LiveSession.Status.COMPLETED):
        return Response({"detail": "Quiz is not active or completed."}, status=status.HTTP_400_BAD_REQUEST)

    answers_input = request.data.get("answers") or {}
    questions_by_id = {q.id: q for q in ls.quiz.questions.all()}
    total_questions = len(questions_by_id)

    try:
        with transaction.atomic():
            locked_participant = Participant.objects.select_for_update().get(pk=participant.pk)
            if locked_participant.submitted_at is not None:
                return Response(
                    {"detail": "You have already submitted your answers for this quiz."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            total_score = 0
            correct_count = 0

            for q_id_str, selected_opt in answers_input.items():
                try:
                    qid = int(q_id_str)
                except (ValueError, TypeError):
                    continue

                question = questions_by_id.get(qid)
                if question is None:
                    continue

                selected = str(selected_opt).lower().strip()
                if selected not in ("a", "b", "c", "d"):
                    continue

                is_correct = bool(question.correct_answer and selected == question.correct_answer.lower())
                points = POINTS_CORRECT if is_correct else POINTS_INCORRECT
                if is_correct:
                    correct_count += 1
                    total_score += points

                AnswerSubmission.objects.update_or_create(
                    participant=locked_participant,
                    question=question,
                    defaults={
                        "selected_option": selected,
                        "is_correct": is_correct,
                        "points_awarded": points,
                    },
                )

            locked_participant.score = total_score
            locked_participant.submitted_at = timezone.now()
            locked_participant.save(update_fields=["score", "submitted_at"])

    except IntegrityError:
        return Response({"detail": "Submission failed due to conflict."}, status=status.HTTP_400_BAD_REQUEST)

    publish_submission_update(ls)

    accuracy = round(correct_count / total_questions * 100) if total_questions > 0 else 0
    return Response(
        {
            "accepted": True,
            "score": total_score,
            "correct_count": correct_count,
            "total_questions": total_questions,
            "accuracy": accuracy,
        }
    )


# ---------------------------------------------------------------------------
# POST /api/sessions/<pin>/answer/ (Single answer submission fallback)
# ---------------------------------------------------------------------------

@api_view(["POST"])
def submit_answer(request, game_pin):
    """
    Body: { "selected_option": "a" | "b" | "c" | "d", "question_id": Optional[int] }
    Accepts single answer or routes to batch submission.
    """
    ls = LiveSession.objects.filter(game_pin=game_pin.upper()).first()
    if ls is None:
        return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

    participant = _get_participant(request, ls)
    if participant is None:
        return Response(
            {"detail": "You are not a participant in this session."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if "answers" in request.data:
        return submit_quiz_answers(request, game_pin)

    selected = (request.data.get("selected_option") or "").lower().strip()
    if selected not in ("a", "b", "c", "d"):
        return Response(
            {"detail": "selected_option must be one of: a, b, c, d."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    question_id = request.data.get("question_id")
    if question_id:
        question = Question.objects.filter(id=question_id, quiz=ls.quiz).first()
    else:
        question = ls.current_question() or ls.quiz.questions.first()

    if question is None:
        return Response({"detail": "No question found."}, status=status.HTTP_400_BAD_REQUEST)

    maybe_close_question(ls)

    if ls.status != LiveSession.Status.ACTIVE:
        return Response({"detail": "Session is not active."}, status=status.HTTP_400_BAD_REQUEST)

    if not ls.is_answer_phase_open():
        return Response({"detail": "Answer window has closed."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        locked_session = LiveSession.objects.select_for_update().get(pk=ls.pk)
        if locked_session.status != LiveSession.Status.ACTIVE:
            return Response({"detail": "Session is not active."}, status=status.HTTP_400_BAD_REQUEST)
        if not locked_session.is_answer_phase_open():
            return Response({"detail": "Answer window has closed."}, status=status.HTTP_400_BAD_REQUEST)

        locked_participant = Participant.objects.select_for_update().get(pk=participant.pk)
        is_correct = bool(question.correct_answer and selected == question.correct_answer.lower())
        points = POINTS_CORRECT if is_correct else POINTS_INCORRECT

        sub, created = AnswerSubmission.objects.get_or_create(
            participant=locked_participant,
            question=question,
            defaults={"selected_option": selected, "is_correct": is_correct, "points_awarded": points},
        )
        if not created:
            return Response({"detail": "You have already answered this question."}, status=status.HTTP_400_BAD_REQUEST)

        Participant.objects.filter(pk=locked_participant.pk).update(score=F("score") + points)
        locked_participant.refresh_from_db(fields=["score"])

    return Response({"accepted": True, "submitted_option": selected})


# ---------------------------------------------------------------------------
# Host Session Controls (Start, End, Kick, Admit) — Authenticated Host Only
# ---------------------------------------------------------------------------

@api_view(["POST"])
def host_start_quiz(request, game_pin):
    """Host starts the quiz for everyone."""
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    ls = LiveSession.objects.filter(game_pin=game_pin.upper(), quiz__author=request.user).first()
    if ls is None:
        return Response({"detail": "Session not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

    if ls.status == LiveSession.Status.WAITING:
        if not ls.can_start():
            return Response({"detail": "Cannot start quiz without valid questions."}, status=status.HTTP_400_BAD_REQUEST)
        ls.status = LiveSession.Status.ACTIVE
        ls.quiz_started_at = timezone.now()
        ls.current_question_index = 0
        custom_limit = request.data.get("total_time_limit") or request.data.get("time_limit")
        if custom_limit and int(custom_limit) > 0:
            ls.total_time_limit = int(custom_limit)
        elif not ls.total_time_limit:
            ls.total_time_limit = getattr(ls.quiz, "time_limit", 300) or 300
        ls.save(update_fields=["status", "quiz_started_at", "current_question_index", "total_time_limit"])
        publish_quiz_start(ls)
        publish_lobby_state(ls)

    return Response({
        "status": ls.status,
        "quiz_started_at": ls.quiz_started_at.isoformat() if ls.quiz_started_at else None,
        "total_time_limit": ls.total_time_limit,
        "seconds_remaining": ls.seconds_remaining(),
    })


@api_view(["POST"])
def host_end_quiz(request, game_pin):
    """Host manually ends the quiz."""
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    ls = LiveSession.objects.filter(game_pin=game_pin.upper(), quiz__author=request.user).first()
    if ls is None:
        return Response({"detail": "Session not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

    if ls.status == LiveSession.Status.ACTIVE:
        ls.status = LiveSession.Status.COMPLETED
        ls.ended_at = timezone.now()
        ls.save(update_fields=["status", "ended_at"])
        publish_quiz_complete(ls)
        publish_lobby_state(ls)

    return Response({"status": ls.status, "completed": True})


@api_view(["POST"])
def host_kick_participant(request, game_pin):
    """Host removes a participant from the session."""
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    ls = LiveSession.objects.filter(game_pin=game_pin.upper(), quiz__author=request.user).first()
    if ls is None:
        return Response({"detail": "Session not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

    participant_id = request.data.get("participant_id")
    if not participant_id:
        return Response({"detail": "participant_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    participant = Participant.objects.filter(id=participant_id, live_session=ls).first()
    if participant is None:
        return Response({"detail": "Participant not found."}, status=status.HTTP_404_NOT_FOUND)

    participant.is_kicked = True
    participant.save(update_fields=["is_kicked"])
    publish_participant_kicked(ls, participant.id)

    return Response({"kicked": True, "participant_id": participant.id})


@api_view(["POST"])
def host_admit_participant(request, game_pin):
    """Host admits a waiting/late participant into the live quiz."""
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    ls = LiveSession.objects.filter(game_pin=game_pin.upper(), quiz__author=request.user).first()
    if ls is None:
        return Response({"detail": "Session not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

    participant_id = request.data.get("participant_id")
    if not participant_id:
        return Response({"detail": "participant_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    participant = Participant.objects.filter(id=participant_id, live_session=ls).first()
    if participant is None:
        return Response({"detail": "Participant not found."}, status=status.HTTP_404_NOT_FOUND)

    participant.is_admitted = True
    participant.save(update_fields=["is_admitted"])
    publish_participant_admitted(ls, participant.id)

    return Response({
        "admitted": True,
        "participant_id": participant.id,
        "display_name": participant.display_name,
    })


# ---------------------------------------------------------------------------
# Leaderboard & Results Endpoints
# ---------------------------------------------------------------------------

@api_view(["GET"])
def leaderboard(request, game_pin):
    ls = LiveSession.objects.filter(game_pin=game_pin.upper()).first()
    if ls is None:
        return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

    data = _leaderboard_data(ls)
    participant = _get_participant(request, ls)
    own_entry = None
    if participant is not None:
        own_entry = next((p for p in data if p["id"] == participant.id), None)

    return Response({"leaderboard": data, "own": own_entry})


@api_view(["GET"])
def participant_result(request, game_pin):
    """Returns full per-question results for the requesting participant."""
    ls = LiveSession.objects.filter(game_pin=game_pin.upper()).first()
    if ls is None:
        return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

    participant = _get_participant(request, ls)
    if participant is None:
        return Response(
            {"detail": "You are not a participant in this session."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Only reveal final results and correct answers once the session is COMPLETED
    if ls.status != LiveSession.Status.COMPLETED:
        return Response({
            "status": ls.status,
            "has_submitted": bool(participant.submitted_at),
            "display_name": participant.display_name,
            "message": "Quiz is in progress. Results and standings will be revealed when the session completes.",
        })

    questions = list(ls.quiz.questions.order_by("order", "id"))
    total = len(questions)
    submissions = {
        s.question_id: s
        for s in AnswerSubmission.objects.filter(participant=participant)
    }

    answers = []
    correct_count = 0
    for q in questions:
        sub = submissions.get(q.id)
        is_corr = bool(sub and sub.is_correct)
        if is_corr:
            correct_count += 1
        answers.append(
            {
                "question_id": q.id,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
                "correct_answer": q.correct_answer,
                "selected_option": sub.selected_option if sub else None,
                "is_correct": is_corr,
                "points_awarded": sub.points_awarded if sub else 0,
            }
        )

    ranked = list(
        ls.participants.filter(is_kicked=False, is_admitted=True)
        .order_by("-score", "submitted_at", "joined_at")
        .values_list("id", flat=True)
    )
    rank = ranked.index(participant.id) + 1 if participant.id in ranked else None

    return Response(
        {
            "display_name": participant.display_name,
            "score": participant.score,
            "rank": rank,
            "total_participants": len(ranked),
            "correct_count": correct_count,
            "total_questions": total,
            "accuracy": round(correct_count / total * 100) if total else 0,
            "percentage": round(correct_count / total * 100) if total else 0,
            "answers": answers,
        }
    )


@api_view(["GET"])
def host_result(request, game_pin):
    """Returns full participant leaderboard and answers for the host results screen."""
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    ls = LiveSession.objects.filter(game_pin=game_pin.upper(), quiz__author=request.user).first()
    if ls is None:
        return Response({"detail": "Session not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

    leaderboard_data = _leaderboard_data(ls)
    questions = list(ls.quiz.questions.order_by("order", "id"))
    total_q = len(questions)

    for entry in leaderboard_data:
        entry["accuracy"] = round(entry["score"] / (total_q * POINTS_CORRECT) * 100) if total_q > 0 else 0

    return Response(
        {
            "quiz_title": ls.quiz.title,
            "game_pin": ls.game_pin,
            "total_questions": total_q,
            "total_participants": len(leaderboard_data),
            "leaderboard": leaderboard_data,
        }
    )


# ---------------------------------------------------------------------------
# Quiz Authoring & Library REST APIs (Strict Host Ownership)
# ---------------------------------------------------------------------------

@api_view(["GET"])
def api_host_quizzes(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    quizzes = Quiz.objects.filter(author=request.user).order_by("-id")
    data = []
    for q in quizzes:
        data.append({
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "category": q.category,
            "difficulty": q.difficulty,
            "time_limit": q.time_limit,
            "question_count": q.questions.count(),
        })
    return Response({"quizzes": data})


@api_view(["POST"])
def api_create_quiz(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    title = (request.data.get("title") or "").strip()
    if not title:
        return Response({"detail": "Title is required."}, status=status.HTTP_400_BAD_REQUEST)
    description = (request.data.get("description") or "").strip()
    category = (request.data.get("category") or "General").strip() or "General"
    difficulty = (request.data.get("difficulty") or "easy").strip() or "easy"
    time_limit = int(request.data.get("time_limit") or 300)

    quiz = Quiz.objects.create(
        title=title,
        description=description,
        category=category,
        difficulty=difficulty,
        time_limit=time_limit,
        author=request.user,
    )

    return Response({
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "category": quiz.category,
        "difficulty": quiz.difficulty,
        "time_limit": quiz.time_limit,
        "question_count": 0,
    }, status=status.HTTP_201_CREATED)


@api_view(["POST", "DELETE"])
def api_delete_quiz(request, quiz_id):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    quiz = Quiz.objects.filter(id=quiz_id, author=request.user).first()
    if quiz is None:
        return Response({"detail": "Quiz not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)
    quiz.delete()
    return Response({"deleted": True})


@api_view(["GET"])
def api_quiz_detail(request, quiz_id):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    quiz = Quiz.objects.filter(id=quiz_id, author=request.user).first()
    if quiz is None:
        return Response({"detail": "Quiz not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

    questions = [
        {
            "id": q.id,
            "question_text": q.question_text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct_answer": q.correct_answer,
            "time_limit": q.time_limit,
            "order": q.order,
        }
        for q in quiz.questions.order_by("order", "id")
    ]

    return Response({
        "quiz": {
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "category": quiz.category,
            "difficulty": quiz.difficulty,
            "time_limit": quiz.time_limit,
            "question_count": len(questions),
        },
        "questions": questions,
    })


@api_view(["POST"])
def api_add_question(request, quiz_id):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    quiz = Quiz.objects.filter(id=quiz_id, author=request.user).first()
    if quiz is None:
        return Response({"detail": "Quiz not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

    text = (request.data.get("question_text") or "").strip()
    opt_a = (request.data.get("option_a") or "").strip()
    opt_b = (request.data.get("option_b") or "").strip()
    opt_c = (request.data.get("option_c") or "").strip()
    opt_d = (request.data.get("option_d") or "").strip()
    correct = (request.data.get("correct_answer") or "").lower().strip()
    time_limit = int(request.data.get("time_limit") or 20)

    if not text or not opt_a or not opt_b:
        return Response({"detail": "Question text and Options A & B are required."}, status=status.HTTP_400_BAD_REQUEST)

    if correct not in ("a", "b", "c", "d"):
        return Response({"detail": "Correct answer must be one of: 'a', 'b', 'c', or 'd'."}, status=status.HTTP_400_BAD_REQUEST)

    next_order = (quiz.questions.order_by("-order").values_list("order", flat=True).first() or 0) + 1

    q = Question.objects.create(
        quiz=quiz,
        question_text=text,
        option_a=opt_a,
        option_b=opt_b,
        option_c=opt_c,
        option_d=opt_d,
        correct_answer=correct,
        time_limit=time_limit,
        order=next_order,
    )

    return Response({
        "question": {
            "id": q.id,
            "question_text": q.question_text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct_answer": q.correct_answer,
            "time_limit": q.time_limit,
            "order": q.order,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(["POST", "PUT", "PATCH"])
def api_update_question(request, quiz_id, question_id):
    """Update an existing question on a host-owned quiz."""
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    quiz = Quiz.objects.filter(id=quiz_id, author=request.user).first()
    if quiz is None:
        return Response({"detail": "Quiz not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

    q = Question.objects.filter(id=question_id, quiz=quiz).first()
    if q is None:
        return Response({"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND)

    text = (request.data.get("question_text") or "").strip()
    opt_a = (request.data.get("option_a") or "").strip()
    opt_b = (request.data.get("option_b") or "").strip()
    opt_c = (request.data.get("option_c") or "").strip()
    opt_d = (request.data.get("option_d") or "").strip()
    correct = (request.data.get("correct_answer") or "").strip().lower()
    time_limit = int(request.data.get("time_limit") or q.time_limit or 20)

    if not text or not opt_a or not opt_b or not opt_c or not opt_d:
        return Response({"detail": "Question text and all 4 options (A, B, C, D) are required."}, status=status.HTTP_400_BAD_REQUEST)

    if correct not in ("a", "b", "c", "d"):
        return Response({"detail": "Correct answer must be one of: 'a', 'b', 'c', or 'd'."}, status=status.HTTP_400_BAD_REQUEST)

    q.question_text = text
    q.option_a = opt_a
    q.option_b = opt_b
    q.option_c = opt_c
    q.option_d = opt_d
    q.correct_answer = correct
    q.time_limit = time_limit
    q.save()

    return Response({
        "question": {
            "id": q.id,
            "question_text": q.question_text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct_answer": q.correct_answer,
            "time_limit": q.time_limit,
            "order": q.order,
        },
        "message": "Question updated successfully.",
    }, status=status.HTTP_200_OK)


@api_view(["POST", "DELETE"])
def api_delete_question(request, quiz_id, question_id):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    quiz = Quiz.objects.filter(id=quiz_id, author=request.user).first()
    if quiz is None:
        return Response({"detail": "Quiz not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)
    q = Question.objects.filter(id=question_id, quiz=quiz).first()
    if q is None:
        return Response({"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND)
    q.delete()
    return Response({"deleted": True})


@api_view(["POST"])
def api_create_live_session(request, quiz_id):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    quiz = Quiz.objects.filter(id=quiz_id, author=request.user).first()
    if quiz is None:
        return Response({"detail": "Quiz not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

    # Complete prior active/waiting sessions for this host
    LiveSession.objects.filter(
        host=request.user,
        status__in=[LiveSession.Status.WAITING, LiveSession.Status.ACTIVE]
    ).update(status=LiveSession.Status.COMPLETED, ended_at=timezone.now())

    ls = LiveSession.objects.create(
        quiz=quiz,
        host=request.user,
        total_time_limit=getattr(quiz, "time_limit", 300) or 300,
    )
    return Response({
        "session_id": ls.id,
        "game_pin": ls.game_pin,
    }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def api_join_game(request):
    """Participant join endpoint — public guest-based."""
    pin = (request.data.get("game_pin") or "").upper().strip()
    name = (request.data.get("display_name") or "").strip()

    if not pin:
        return Response({"detail": "Game PIN is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not name:
        return Response({"detail": "Nickname is required."}, status=status.HTTP_400_BAD_REQUEST)

    ls = LiveSession.objects.filter(game_pin=pin).first()
    if ls is None:
        return Response({"detail": "Session not found with that PIN."}, status=status.HTTP_404_NOT_FOUND)

    if ls.status == LiveSession.Status.COMPLETED:
        return Response({"detail": "This quiz has already ended."}, status=status.HTTP_400_BAD_REQUEST)

    # Check for existing participant via explicit authoritative token only (never ambient browser cookies)
    existing_token = (
        request.headers.get("X-Participant-Token")
        or request.data.get("join_token")
        or request.data.get("participant_token")
        or request.GET.get("pt")
    )
    if existing_token:
        existing = Participant.objects.filter(live_session=ls, join_token=existing_token).first()
        if existing:
            if existing.is_kicked:
                # If this kicked participant is trying to rejoin with their kicked name/token
                if existing.display_name.lower() == name.lower():
                    return Response(
                        {"detail": "You have been removed from this quiz. Ask the host if you need to rejoin."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                # If they provided a stale kicked token but are joining with a different name,
                # do not let the old token block them; treat as a fresh join attempt.
                existing = None
            elif existing.display_name.lower() == name.lower():
                # Legitimate participant reconnecting with their own display name
                res = Response({
                    "join_token": existing.join_token,
                    "game_pin": ls.game_pin,
                    "display_name": existing.display_name,
                    "is_admitted": existing.is_admitted,
                }, status=status.HTTP_200_OK)
                res.set_cookie(
                    _participant_cookie_name(ls),
                    existing.join_token,
                    max_age=60 * 60 * 24,
                    httponly=True,
                    samesite="Lax",
                )
                return res
            else:
                # Participant attempting to rename themselves
                if Participant.objects.filter(live_session=ls, display_name__iexact=name).exclude(id=existing.id).exists():
                    return Response({"detail": "Name already in use"}, status=status.HTTP_400_BAD_REQUEST)
                if Participant.objects.filter(live_session=ls, display_name__iexact=name, is_kicked=True).exclude(id=existing.id).exists():
                    return Response(
                        {"detail": "You have been removed from this quiz. Ask the host if you need to rejoin."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                existing.display_name = name
                existing.save(update_fields=["display_name"])
                publish_lobby_state(ls)
                res = Response({
                    "join_token": existing.join_token,
                    "game_pin": ls.game_pin,
                    "display_name": existing.display_name,
                    "is_admitted": existing.is_admitted,
                }, status=status.HTTP_200_OK)
                res.set_cookie(
                    _participant_cookie_name(ls),
                    existing.join_token,
                    max_age=60 * 60 * 24,
                    httponly=True,
                    samesite="Lax",
                )
                return res

    # Check if this name is already taken or was kicked in this session
    existing_named = Participant.objects.filter(live_session=ls, display_name__iexact=name).first()
    if existing_named:
        if existing_named.is_kicked:
            return Response(
                {"detail": "You have been removed from this quiz. Ask the host if you need to rejoin."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Same name + no valid participant token -> reject: "Name already in use"
        return Response(
            {"detail": "Name already in use"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    is_admitted = (ls.status == LiveSession.Status.WAITING)

    p = Participant.objects.create(
        live_session=ls,
        display_name=name,
        join_token=secrets.token_hex(20),
        is_admitted=is_admitted,
    )
    publish_lobby_state(ls)

    res = Response({
        "join_token": p.join_token,
        "game_pin": ls.game_pin,
        "display_name": p.display_name,
        "is_admitted": p.is_admitted,
    }, status=status.HTTP_201_CREATED)
    res.set_cookie(
        _participant_cookie_name(ls),
        p.join_token,
        max_age=60 * 60 * 24,
        httponly=True,
        samesite="Lax",
    )
    return res


# ---------------------------------------------------------------------------
# JSON Export, JSON Import & Question Reordering (Host Owned)
# ---------------------------------------------------------------------------

@api_view(["GET"])
def api_export_quiz(request, quiz_id):
    """Export a quiz and its questions to standard Koozy JSON format."""
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    quiz = Quiz.objects.filter(id=quiz_id, author=request.user).first()
    if quiz is None:
        return Response({"detail": "Quiz not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

    questions = quiz.questions.all().order_by("order", "id")
    data = {
        "title": quiz.title,
        "description": quiz.description,
        "category": quiz.category,
        "difficulty": quiz.difficulty,
        "time_limit": quiz.time_limit,
        "questions": [
            {
                "question": q.question_text,
                "options": {
                    "A": q.option_a,
                    "B": q.option_b,
                    "C": q.option_c,
                    "D": q.option_d,
                },
                "correct_answer": q.correct_answer.upper(),
            }
            for q in questions
        ],
    }
    safe_name = quiz.title.lower().replace(" ", "_").replace("/", "_")
    json_content = json.dumps(data, indent=2)
    response = HttpResponse(json_content, content_type="application/json")
    response["Content-Disposition"] = f'attachment; filename="{safe_name}.json"'
    return response


@api_view(["POST"])
def api_import_quiz(request):
    """Import a quiz from JSON payload or uploaded .json file."""
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data
    if not isinstance(data, dict):
        try:
            data = json.loads(request.body)
        except Exception:
            return Response({"detail": "Invalid JSON format."}, status=status.HTTP_400_BAD_REQUEST)

    title = (data.get("title") or "").strip()
    if not title:
        return Response({"detail": "Quiz 'title' is required."}, status=status.HTTP_400_BAD_REQUEST)

    raw_questions = data.get("questions")
    if not isinstance(raw_questions, list) or len(raw_questions) == 0:
        return Response(
            {"detail": "Quiz must contain a 'questions' list with at least one question."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    validated_questions = []
    for idx, q in enumerate(raw_questions, start=1):
        if not isinstance(q, dict):
            return Response({"detail": f"Question #{idx} must be an object."}, status=status.HTTP_400_BAD_REQUEST)

        q_text = (q.get("question") or q.get("question_text") or "").strip()
        if not q_text:
            return Response({"detail": f"Question #{idx} is missing question text."}, status=status.HTTP_400_BAD_REQUEST)

        opts = q.get("options")
        if isinstance(opts, dict):
            opt_a = str(opts.get("A") or opts.get("a") or "").strip()
            opt_b = str(opts.get("B") or opts.get("b") or "").strip()
            opt_c = str(opts.get("C") or opts.get("c") or "").strip()
            opt_d = str(opts.get("D") or opts.get("d") or "").strip()
        else:
            opt_a = str(q.get("option_a") or "").strip()
            opt_b = str(q.get("option_b") or "").strip()
            opt_c = str(q.get("option_c") or "").strip()
            opt_d = str(q.get("option_d") or "").strip()

        if not (opt_a and opt_b and opt_c and opt_d):
            return Response(
                {"detail": f"Question #{idx} must provide all 4 options (A, B, C, D)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        corr = str(q.get("correct_answer") or "").strip().lower()
        if corr not in ("a", "b", "c", "d"):
            return Response(
                {"detail": f"Question #{idx} has invalid correct_answer '{corr}'. Must be A, B, C, or D."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated_questions.append({
            "question_text": q_text,
            "option_a": opt_a,
            "option_b": opt_b,
            "option_c": opt_c,
            "option_d": opt_d,
            "correct_answer": corr,
            "order": idx,
        })

    with transaction.atomic():
        quiz = Quiz.objects.create(
            title=title,
            description=(data.get("description") or "").strip(),
            category=(data.get("category") or "General").strip(),
            difficulty=(data.get("difficulty") or "easy").strip(),
            time_limit=int(data.get("time_limit") or 300),
            author=request.user,
        )
        for vq in validated_questions:
            Question.objects.create(quiz=quiz, **vq)

    return Response({
        "id": quiz.id,
        "title": quiz.title,
        "question_count": len(validated_questions),
        "message": "Quiz imported successfully.",
    }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def api_reorder_questions(request, quiz_id):
    """Update question display ordering for a quiz."""
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    quiz = Quiz.objects.filter(id=quiz_id, author=request.user).first()
    if quiz is None:
        return Response({"detail": "Quiz not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

    question_ids = request.data.get("question_ids")
    if not isinstance(question_ids, list):
        return Response({"detail": "question_ids must be a list."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        for order, q_id in enumerate(question_ids, start=1):
            Question.objects.filter(id=q_id, quiz=quiz).update(order=order)

    return Response({"reordered": True, "question_ids": question_ids})


# ---------------------------------------------------------------------------
# AI Quiz Generator REST APIs (Host Owned)
# ---------------------------------------------------------------------------

@api_view(["POST"])
def api_ai_generate_quiz(request):
    """
    Generate a complete quiz using Gemini AI, validate strictly,
    and save atomically under the authenticated host's ownership.
    """
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    prompt = str(request.data.get("prompt") or "").strip()
    if not prompt:
        return Response(
            {"detail": "Please provide a quiz topic or instructions."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(prompt) > 1000:
        return Response(
            {"detail": "Prompt is too long (maximum 1000 characters)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    raw_count = request.data.get("question_count")
    if raw_count is None or raw_count == "":
        question_count = 5
    else:
        try:
            question_count = int(raw_count)
        except (ValueError, TypeError):
            return Response(
                {"detail": "Question count must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if question_count < 1 or question_count > 25:
        return Response(
            {"detail": "Question count must be between 1 and 25."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from .ai_service import (
        consume_daily_quota_atomic,
        generate_quiz_with_gemini,
        get_remaining_daily_quota,
    )

    remaining_quota = get_remaining_daily_quota(request.user)
    if remaining_quota <= 0:
        return Response(
            {"detail": "Daily AI generation limit reached (8/8 attempts used today). Please try again tomorrow."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    try:
        validated_quiz = generate_quiz_with_gemini(prompt, question_count)
    except ValueError as err:
        return Response(
            {"detail": f"The generated quiz couldn't be validated: {err}"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except RuntimeError as err:
        return Response(
            {"detail": str(err)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except Exception as err:
        return Response(
            {"detail": "We couldn't generate the quiz right now. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Successfully generated and validated — consume 1 quota attempt atomically
    consumed, remaining = consume_daily_quota_atomic(request.user)
    if not consumed:
        return Response(
            {"detail": "Daily AI generation limit reached (8/8 attempts used today). Please try again tomorrow."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # Atomically create Quiz and Question records
    with transaction.atomic():
        quiz = Quiz.objects.create(
            title=validated_quiz["title"],
            description=validated_quiz["description"],
            category=validated_quiz["category"],
            difficulty=validated_quiz["difficulty"],
            time_limit=validated_quiz["time_limit"],
            author=request.user,
        )
        for q_data in validated_quiz["questions"]:
            Question.objects.create(quiz=quiz, **q_data)

    return Response(
        {
            "quiz_id": quiz.id,
            "id": quiz.id,
            "title": quiz.title,
            "question_count": len(validated_quiz["questions"]),
            "remaining_quota": remaining,
            "message": "AI Quiz generated successfully!",
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def api_ai_quota(request):
    """Returns the authenticated host's remaining AI generation attempts for today."""
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    from .ai_service import MAX_DAILY_ATTEMPTS, get_remaining_daily_quota

    remaining = get_remaining_daily_quota(request.user)
    return Response({
        "remaining": remaining,
        "limit": MAX_DAILY_ATTEMPTS,
        "used": MAX_DAILY_ATTEMPTS - remaining,
    })


@api_view(["GET"])
def api_ai_prompt_template(request):
    """Returns the host-facing copyable prompt template."""
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    from .ai_service import get_host_ai_prompt_template

    return Response({
        "prompt_template": get_host_ai_prompt_template(),
    })
