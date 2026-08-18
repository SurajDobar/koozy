import json
import secrets
from django.db.models import Count
from django.http import HttpResponseNotAllowed
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone

from .forms import GamePinForm, ParticipantJoinForm, QuestionForm, QuizForm
from .models import AnswerSubmission, LiveSession, Participant, Question, Quiz
from .realtime import (
    maybe_close_question,
    publish_answer_closed,
    publish_lobby_state,
    publish_question_start,
    publish_quiz_complete,
    publish_quiz_start,
)


from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.db.models import Count, Q

# ── Helpers ──────────────────────────────────────────────────────────────────

def _host_quiz_ids(request):
    if request.user.is_authenticated:
        return list(
            Quiz.objects.filter(Q(author=request.user) | Q(author__isnull=True)).values_list("id", flat=True)
        )
    host_quiz_ids = request.session.get("host_quiz_ids")
    if host_quiz_ids is None:
        host_quiz_ids = request.session.pop("teacher_quiz_ids", None)
        if host_quiz_ids is None:
            host_quiz_ids = list(Quiz.objects.values_list("id", flat=True))
        request.session["host_quiz_ids"] = host_quiz_ids
    return host_quiz_ids


def _host_live_session(request, session_id):
    session = get_object_or_404(LiveSession, id=session_id)
    host_quiz_ids = _host_quiz_ids(request)
    if session.quiz_id not in host_quiz_ids:
        request.session["host_quiz_ids"] = [*host_quiz_ids, session.quiz_id]
    return session


def _participant_cookie_name(live_session):
    """Name of the per-device cookie that identifies this participant."""
    return f"kz_pt_{live_session.id}"


def _request_participant(request, live_session):
    token = (
        request.headers.get("X-Participant-Token")
        or request.GET.get("pt")
        or request.COOKIES.get(_participant_cookie_name(live_session))
    )
    if not token:
        return None
    return Participant.objects.filter(join_token=token, live_session=live_session).first()


def _set_participant_cookie(response, live_session, participant):
    response.set_cookie(
        _participant_cookie_name(live_session),
        participant.join_token,
        max_age=60 * 60 * 24,   # 24 hours
        httponly=True,
        samesite="Lax",
    )


# ── Teacher Authentication ───────────────────────────────────────────────────

def auth_login_view(request):
    if request.user.is_authenticated:
        return redirect("host_quiz_list")
    config = {
        "page": "login",
    }
    return render(
        request,
        "quiz/app.html",
        {
            "config_json": json.dumps(config),
            "page_title": "Teacher Sign In — Koozy",
        },
    )


def auth_google_login(request):
    """
    Teacher Google Sign-In handler / callback.
    Authenticates or creates a User instance and establishes session.
    """
    email = (request.GET.get("email") or request.POST.get("email") or "teacher@koozy.edu").strip().lower()
    name = (request.GET.get("name") or request.POST.get("name") or "Teacher").strip()
    
    user, _ = User.objects.get_or_create(username=email, defaults={"email": email, "first_name": name})
    login(request, user)
    return redirect("host_quiz_list")


def auth_logout_view(request):
    logout(request)
    return redirect("home")


# ── Static / informational pages ─────────────────────────────────────────────

def home(request):
    config = {
        "page": "home",
        "user": {
            "is_authenticated": request.user.is_authenticated,
            "name": request.user.first_name or request.user.username,
        } if request.user.is_authenticated else None,
    }
    return render(
        request,
        "quiz/app.html",
        {
            "config_json": json.dumps(config),
            "page_title": "Koozy — Make learning play",
        },
    )


def development_hub(request):
    return render(request, "quiz/development_hub.html")


def quiz_list(request):
    return redirect("host_quiz_list")


# ── Host workspace (authoring) ────────────────────────────────────────────────

def host_quiz_list(request):
    if request.user.is_authenticated:
        quizzes = list(
            Quiz.objects.filter(Q(author=request.user) | Q(author__isnull=True))
            .annotate(question_count=Count("questions"))
            .values("id", "title", "description", "category", "difficulty", "time_limit", "question_count")
        )
    else:
        quizzes = list(
            Quiz.objects.filter(id__in=_host_quiz_ids(request))
            .annotate(question_count=Count("questions"))
            .values("id", "title", "description", "category", "difficulty", "time_limit", "question_count")
        )

    config = {
        "page": "host_quiz_list",
        "quizzes": quizzes,
        "user": {
            "is_authenticated": request.user.is_authenticated,
            "name": request.user.first_name or request.user.username if request.user.is_authenticated else None,
            "email": request.user.email if request.user.is_authenticated else None,
        } if request.user.is_authenticated else None,
    }
    return render(
        request,
        "quiz/app.html",
        {
            "config_json": json.dumps(config),
            "quizzes": quizzes,
            "page_title": "Teacher Dashboard — Koozy",
        },
    )


def create_quiz(request):
    form = QuizForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        quiz = form.save(commit=False)
        if request.user.is_authenticated:
            quiz.author = request.user
        quiz.save()
        quiz_ids = _host_quiz_ids(request)
        request.session["host_quiz_ids"] = [*quiz_ids, quiz.id]
        return redirect("add_question", quiz_id=quiz.id)

    config = {
        "page": "create_quiz",
        "user": {
            "is_authenticated": request.user.is_authenticated,
            "name": request.user.first_name or request.user.username if request.user.is_authenticated else None,
        } if request.user.is_authenticated else None,
    }
    return render(
        request,
        "quiz/app.html",
        {
            "config_json": json.dumps(config),
            "form": form,
            "page_title": "Create Quiz — Koozy",
        },
    )


def add_question(request, quiz_id):
    quiz = get_object_or_404(Quiz, id=quiz_id, id__in=_host_quiz_ids(request))
    form = QuestionForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        question = form.save(commit=False)
        question.quiz = quiz
        question.save()
        return redirect("add_question", quiz_id=quiz.id)

    questions = list(
        quiz.questions.order_by("id").values(
            "id", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "time_limit"
        )
    )
    config = {
        "page": "add_question",
        "quizId": quiz.id,
        "quiz": {
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "category": quiz.category,
            "difficulty": quiz.difficulty,
            "time_limit": quiz.time_limit,
            "questions": questions,
        },
    }
    return render(
        request,
        "quiz/app.html",
        {
            "config_json": json.dumps(config),
            "form": form,
            "quiz": quiz,
            "questions": questions,
            "can_start": quiz.has_valid_questions(),
            "page_title": f"Edit Questions: {quiz.title} — Koozy",
        },
    )


def delete_question(request, quiz_id, question_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    quiz = get_object_or_404(Quiz, id=quiz_id, id__in=_host_quiz_ids(request))
    question = get_object_or_404(Question, id=question_id, quiz=quiz)
    question.delete()
    return redirect("add_question", quiz_id=quiz.id)


def delete_quiz(request, quiz_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    quiz = get_object_or_404(Quiz, id=quiz_id, id__in=_host_quiz_ids(request))
    quiz.delete()
    quiz_ids = [qid for qid in _host_quiz_ids(request) if qid != quiz_id]
    request.session["host_quiz_ids"] = quiz_ids
    return redirect("host_quiz_list")


# ── Host session lifecycle ────────────────────────────────────────────────────

def create_live_session(request, quiz_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    quiz = get_object_or_404(Quiz, id=quiz_id, id__in=_host_quiz_ids(request))
    live_session = LiveSession.objects.create(
        quiz=quiz,
        total_time_limit=getattr(quiz, "time_limit", 300) or 300,
    )
    return redirect("host_lobby", session_id=live_session.id)


def host_lobby(request, session_id):
    live_session = _host_live_session(request, session_id)
    config = {
        "page": "host_session",
        "gamePin": live_session.game_pin,
        "isHost": True,
        "sessionId": live_session.id,
    }
    return render(
        request,
        "quiz/app.html",
        {
            "config_json": json.dumps(config),
            "live_session": live_session,
            "is_host": True,
            "page_title": f"Host Room: {live_session.game_pin} — Koozy",
        },
    )


def start_live_session(request, session_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    live_session = _host_live_session(request, session_id)
    if (
        live_session.status == LiveSession.Status.WAITING
        and live_session.can_start()
    ):
        live_session.status = LiveSession.Status.ACTIVE
        live_session.quiz_started_at = timezone.now()
        live_session.question_started_at = timezone.now()
        live_session.current_question_closed = False
        live_session.current_question_index = 0
        if not live_session.total_time_limit:
            live_session.total_time_limit = getattr(live_session.quiz, "time_limit", 300) or 300
        live_session.save(update_fields=["status", "quiz_started_at", "question_started_at", "current_question_closed", "current_question_index", "total_time_limit"])
        publish_lobby_state(live_session)
        publish_quiz_start(live_session)
    return redirect("host_lobby", session_id=live_session.id)


def host_next_question(request, session_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    live_session = _host_live_session(request, session_id)
    if live_session.status != LiveSession.Status.ACTIVE:
        return redirect("host_lobby", session_id=live_session.id)

    questions = list(live_session.quiz.questions.order_by("id"))
    next_index = live_session.current_question_index + 1

    if next_index >= len(questions):
        live_session.status = LiveSession.Status.COMPLETED
        live_session.ended_at = timezone.now()
        live_session.save(update_fields=["status", "ended_at"])
        publish_quiz_complete(live_session)
        return redirect("host_result_page", session_id=live_session.id)

    live_session.current_question_index = next_index
    live_session.question_started_at = timezone.now()
    live_session.current_question_closed = False
    live_session.save(update_fields=["current_question_index", "question_started_at", "current_question_closed"])
    publish_quiz_start(live_session)
    return redirect("host_lobby", session_id=live_session.id)


def host_close_question(request, session_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    live_session = _host_live_session(request, session_id)
    if live_session.status == LiveSession.Status.ACTIVE and not live_session.current_question_closed:
        live_session.current_question_closed = True
        live_session.save(update_fields=["current_question_closed"])
        publish_answer_closed(live_session)
    return redirect("host_lobby", session_id=live_session.id)


def host_result_page(request, session_id):
    live_session = _host_live_session(request, session_id)
    config = {
        "page": "host_session",
        "gamePin": live_session.game_pin,
        "isHost": True,
        "sessionId": live_session.id,
    }
    return render(
        request,
        "quiz/app.html",
        {
            "config_json": json.dumps(config),
            "live_session": live_session,
            "is_host": True,
            "page_title": f"Results: {live_session.game_pin} — Koozy",
        },
    )


# ── Participant join flow ─────────────────────────────────────────────────────

def join_game(request):
    form = GamePinForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        game_pin = form.cleaned_data["game_pin"]
        live_session = LiveSession.objects.filter(game_pin=game_pin).first()
        if live_session is None:
            form.add_error("game_pin", "We couldn't find that Game PIN.")
        elif live_session.status != LiveSession.Status.WAITING:
            form.add_error("game_pin", "This session is no longer accepting participants.")
        else:
            return redirect("participant_join", game_pin=live_session.game_pin)

    errors = [str(err) for err_list in form.errors.values() for err in err_list]
    config = {"page": "join", "errors": errors}
    return render(
        request,
        "quiz/app.html",
        {
            "config_json": json.dumps(config),
            "form": form,
            "form_errors": " ".join(errors),
            "page_title": "Join Live Quiz — Koozy",
        },
    )


def participant_join(request, game_pin):
    live_session = get_object_or_404(LiveSession, game_pin=game_pin.upper())

    # Only redirect if an explicit tab token was provided in header/query
    explicit_token = request.headers.get("X-Participant-Token") or request.GET.get("pt")
    if explicit_token:
        existing_participant = Participant.objects.filter(
            join_token=explicit_token, live_session=live_session, is_kicked=False
        ).first()
        if existing_participant is not None:
            return redirect(
                f"{reverse('participant_lobby', args=[live_session.game_pin])}?pt={existing_participant.join_token}"
            )

    form = ParticipantJoinForm(request.POST or None, live_session=live_session)
    if live_session.status != LiveSession.Status.WAITING:
        form.add_error(None, "This session is no longer accepting participants.")
    elif request.method == "POST" and form.is_valid():
        participant = form.save(commit=False)
        participant.live_session = live_session
        participant.join_token = secrets.token_hex(20)
        participant.save()
        publish_lobby_state(live_session)
        target_url = f"{reverse('participant_lobby', args=[live_session.game_pin])}?pt={participant.join_token}"
        response = redirect(target_url)
        _set_participant_cookie(response, live_session, participant)
        return response

    errors = [str(err) for err_list in form.errors.values() for err in err_list]
    config = {
        "page": "join_pin",
        "gamePin": live_session.game_pin,
        "quizTitle": live_session.quiz.title,
        "errors": errors,
    }
    return render(
        request,
        "quiz/app.html",
        {
            "config_json": json.dumps(config),
            "form": form,
            "form_errors": " ".join(errors),
            "live_session": live_session,
            "page_title": f"Join {live_session.game_pin} — Choose the name other participants will see.",
        },
    )


def participant_lobby(request, game_pin):
    live_session = get_object_or_404(LiveSession, game_pin=game_pin.upper())
    participant = _request_participant(request, live_session)
    if participant is None:
        return redirect("participant_join", game_pin=live_session.game_pin)

    config = {
        "page": "participant_session",
        "gamePin": live_session.game_pin,
        "isHost": False,
        "participantToken": participant.join_token,
        "participantName": participant.display_name,
        "sessionId": live_session.id,
    }
    return render(
        request,
        "quiz/app.html",
        {
            "config_json": json.dumps(config),
            "live_session": live_session,
            "participant": participant,
            "is_host": False,
            "page_title": f"Waiting Room: {live_session.game_pin} — Koozy",
        },
    )


def participant_play(request, game_pin):
    live_session = get_object_or_404(LiveSession, game_pin=game_pin.upper())
    participant = _request_participant(request, live_session)
    if participant is None:
        return redirect("participant_join", game_pin=live_session.game_pin)

    config = {
        "page": "participant_session",
        "gamePin": live_session.game_pin,
        "isHost": False,
        "participantToken": participant.join_token,
        "participantName": participant.display_name,
        "sessionId": live_session.id,
    }
    return render(
        request,
        "quiz/app.html",
        {
            "config_json": json.dumps(config),
            "live_session": live_session,
            "participant": participant,
            "is_host": False,
            "page_title": f"Live Quiz: {live_session.game_pin} — Koozy",
        },
    )


def participant_result_page(request, game_pin):
    live_session = get_object_or_404(LiveSession, game_pin=game_pin.upper())
    participant = _request_participant(request, live_session)
    if participant is None:
        return redirect("participant_join", game_pin=live_session.game_pin)

    # Only allow results after the session is completed
    if live_session.status != LiveSession.Status.COMPLETED:
        # Redirect participants back to the lobby if the quiz is still in progress
        return redirect('participant_lobby', game_pin=live_session.game_pin)

    config = {
        "page": "participant_session",
        "gamePin": live_session.game_pin,
        "isHost": False,
        "participantToken": participant.join_token,
        "participantName": participant.display_name,
        "sessionId": live_session.id,
    }
    return render(
        request,
        "quiz/app.html",
        {
            "config_json": json.dumps(config),
            "live_session": live_session,
            "participant": participant,
            "is_host": False,
            "page_title": f"Results: {live_session.game_pin} — Koozy",
        },
    )
