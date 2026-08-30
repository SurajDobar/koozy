import json
from datetime import timedelta

from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import Client, TestCase, TransactionTestCase
from django.urls import reverse
from django.utils import timezone

from config.asgi import application

from .models import AnswerSubmission, HostProfile, LiveSession, Participant, Question, Quiz
from .realtime import maybe_close_question, publish_lobby_state

User = get_user_model()


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _get_or_create_default_host():
    user, _ = User.objects.get_or_create(
        username="host@koozy.edu",
        defaults={"email": "host@koozy.edu", "first_name": "Default Host"}
    )
    return user


def _make_quiz(title="Test Quiz", author=None):
    if author is None:
        author = _get_or_create_default_host()
    return Quiz.objects.create(
        title=title, description="", category="Test", difficulty="easy", author=author
    )


def _make_question(quiz, text="Q?", correct="a", time_limit=20):
    return Question.objects.create(
        quiz=quiz,
        question_text=text,
        option_a="Opt A", option_b="Opt B",
        option_c="Opt C", option_d="Opt D",
        correct_answer=correct,
        time_limit=time_limit,
    )


def _make_session(quiz, pin="AAAAA", status=LiveSession.Status.WAITING):
    return LiveSession.objects.create(quiz=quiz, game_pin=pin, status=status)


def _make_participant(session, name="Player"):
    return Participant.objects.create(live_session=session, display_name=name)


def _active_session_with_question(pin="BBBBB", time_limit=20):
    """Returns (live_session, question, participant) — answer phase open."""
    quiz = _make_quiz()
    q = _make_question(quiz, time_limit=time_limit)
    session = LiveSession.objects.create(
        quiz=quiz, game_pin=pin,
        status=LiveSession.Status.ACTIVE,
        current_question_index=0,
        question_started_at=timezone.now(),
    )
    participant = _make_participant(session)
    return session, q, participant


def _expired_session_with_question(pin, time_limit=20):
    """Returns (live_session, question, participant) — timer has run out, not yet closed."""
    quiz = _make_quiz()
    q = _make_question(quiz, time_limit=time_limit)
    session = LiveSession.objects.create(
        quiz=quiz, game_pin=pin,
        status=LiveSession.Status.ACTIVE,
        current_question_index=0,
        question_started_at=timezone.now() - timedelta(seconds=time_limit + 5),
    )
    participant = _make_participant(session)
    return session, q, participant


# ──────────────────────────────────────────────────────────────────────────────
# Host quiz authoring
# ──────────────────────────────────────────────────────────────────────────────

class HostQuizAuthoringTests(TestCase):
    def setUp(self):
        self.host_user = _get_or_create_default_host()
        self.client.force_login(self.host_user)

    def test_host_can_create_quiz_and_add_multiple_questions(self):
        response = self.client.post(
            reverse("create_quiz"),
            {
                "title": "Django fundamentals",
                "description": "Core concepts",
                "category": "Programming",
                "difficulty": "easy",
            },
        )

        quiz = Quiz.objects.get(title="Django fundamentals")
        self.assertRedirects(response, reverse("add_question", args=[quiz.id]))
        self.assertContains(self.client.get(reverse("host_quiz_list")), quiz.title)

        question_data = {
            "question_text": "Which command starts Django's server?",
            "option_a": "runserver",
            "option_b": "makemigrations",
            "option_c": "collectstatic",
            "option_d": "migrate",
            "correct_answer": "a",
        }
        self.client.post(reverse("add_question", args=[quiz.id]), question_data)
        question_data["question_text"] = "Which file contains URL routes?"
        question_data["correct_answer"] = "b"
        self.client.post(reverse("add_question", args=[quiz.id]), question_data)

        self.assertEqual(quiz.questions.count(), 2)
        self.assertEqual(
            Question.objects.get(question_text__startswith="Which command").correct_answer, "a"
        )

    def test_host_can_delete_question(self):
        quiz = _make_quiz("Owned quiz", author=self.host_user)
        q1 = _make_question(quiz, "Q1")
        q2 = _make_question(quiz, "Q2")
        self.assertEqual(quiz.questions.count(), 2)

        resp = self.client.post(reverse("delete_question", args=[quiz.id, q1.id]))
        self.assertRedirects(resp, reverse("add_question", args=[quiz.id]))
        self.assertEqual(quiz.questions.count(), 1)
        self.assertFalse(Question.objects.filter(id=q1.id).exists())
        self.assertTrue(Question.objects.filter(id=q2.id).exists())

    def test_host_can_delete_quiz(self):
        quiz = _make_quiz("Quiz to delete", author=self.host_user)
        _make_question(quiz, "Q1")

        resp = self.client.post(reverse("delete_quiz", args=[quiz.id]))
        self.assertRedirects(resp, reverse("host_quiz_list"))
        self.assertFalse(Quiz.objects.filter(id=quiz.id).exists())

    def test_session_state_includes_distribution_when_question_closed(self):
        quiz = _make_quiz(author=self.host_user)
        q = _make_question(quiz, "Q1", correct="a")
        live_session = LiveSession.objects.create(
            quiz=quiz,
            game_pin="DIST1",
            status=LiveSession.Status.ACTIVE,
            current_question_index=0,
            question_started_at=timezone.now(),
            current_question_closed=True,
        )
        p1 = _make_participant(live_session, "P1")
        p2 = _make_participant(live_session, "P2")
        AnswerSubmission.objects.create(participant=p1, question=q, selected_option="a", is_correct=True, points_awarded=1000)
        AnswerSubmission.objects.create(participant=p2, question=q, selected_option="b", is_correct=False, points_awarded=0)

        resp = self.client.get(reverse("api_session_state", args=[live_session.game_pin]))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["question_closed"])
        self.assertEqual(data["distribution"], {"a": 1, "b": 1, "c": 0, "d": 0})
        self.assertEqual(data["question"]["correct_answer"], "a")


# ──────────────────────────────────────────────────────────────────────────────
# Development hub
# ──────────────────────────────────────────────────────────────────────────────

class DevelopmentHubTests(TestCase):
    def test_development_hub_loads_and_links_to_named_entry_points(self):
        response = self.client.get(reverse("development_hub"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Koozy Development Hub")
        for route_name in (
            "host_quiz_list", "create_quiz", "quiz_list", "join_game", "admin:index"
        ):
            self.assertContains(response, reverse(route_name))


# ──────────────────────────────────────────────────────────────────────────────
# Live session basics
# ──────────────────────────────────────────────────────────────────────────────

class LiveSessionTests(TestCase):
    def setUp(self):
        self.host_user = _get_or_create_default_host()
        self.quiz = _make_quiz("Live quiz", author=self.host_user)
        self.client.force_login(self.host_user)

    def host_client(self):
        client = Client()
        client.force_login(self.host_user)
        return client

    def test_host_can_create_a_session_with_a_five_character_pin(self):
        response = self.host_client().post(
            reverse("create_live_session", args=[self.quiz.id])
        )
        live_session = LiveSession.objects.get(quiz=self.quiz)
        self.assertEqual(len(live_session.game_pin), 5)
        self.assertTrue(live_session.game_pin.isalnum())
        self.assertRedirects(response, reverse("host_lobby", args=[live_session.id]))

    def test_generated_pins_are_unique_for_active_sessions(self):
        first = LiveSession.objects.create(quiz=self.quiz, host=self.host_user)
        second = LiveSession.objects.create(quiz=self.quiz, host=self.host_user)
        self.assertNotEqual(first.game_pin, second.game_pin)
        with self.assertRaises(IntegrityError):
            LiveSession.objects.create(quiz=self.quiz, game_pin=first.game_pin, host=self.host_user)

    def test_participant_can_join_and_refresh_without_duplication(self):
        live_session = LiveSession.objects.create(quiz=self.quiz, game_pin="ABCDE")
        guest_client = Client()
        response = guest_client.post(reverse("join_game"), {"game_pin": "abcde"})
        self.assertRedirects(response, reverse("participant_join", args=["ABCDE"]))

        response = guest_client.post(
            reverse("participant_join", args=["ABCDE"]), {"display_name": "Avery"}
        )
        participant = live_session.participants.get(display_name="Avery")
        self.assertRedirects(
            response,
            f"{reverse('participant_lobby', args=['ABCDE'])}?pt={participant.join_token}",
        )
        self.assertEqual(live_session.participants.count(), 1)

        # Visiting join page without explicit token shows join form (for another participant)
        resp_join = guest_client.get(reverse("participant_join", args=["ABCDE"]))
        self.assertEqual(resp_join.status_code, 200)
        self.assertEqual(live_session.participants.count(), 1)

        # Visiting with explicit token redirects to lobby for that participant
        resp_pt = guest_client.get(
            f"{reverse('participant_join', args=['ABCDE'])}?pt={participant.join_token}"
        )
        self.assertRedirects(
            resp_pt,
            f"{reverse('participant_lobby', args=['ABCDE'])}?pt={participant.join_token}",
        )

    def test_invalid_pin_duplicate_name_and_closed_session_are_rejected(self):
        live_session = LiveSession.objects.create(quiz=self.quiz, game_pin="ABCDE")
        guest_client = Client()
        invalid_pin = guest_client.post(reverse("join_game"), {"game_pin": "ZZZZZ"})
        self.assertContains(invalid_pin, "find that Game PIN")

        first_client = Client()
        first_client.post(
            reverse("participant_join", args=["ABCDE"]), {"display_name": "Avery"}
        )
        duplicate = guest_client.post(
            reverse("participant_join", args=["ABCDE"]), {"display_name": "avery"}
        )
        self.assertContains(duplicate, "already in use for this session")
        self.assertEqual(live_session.participants.count(), 1)

        live_session.status = LiveSession.Status.ACTIVE
        live_session.save(update_fields=["status"])
        closed = Client().post(reverse("join_game"), {"game_pin": "ABCDE"})
        self.assertContains(closed, "no longer accepting participants")

    def test_host_can_start_a_waiting_session(self):
        _make_question(self.quiz)
        live_session = LiveSession.objects.create(quiz=self.quiz, game_pin="ABCDE", host=self.host_user)
        response = self.host_client().post(
            reverse("start_live_session", args=[live_session.id])
        )
        live_session.refresh_from_db()
        self.assertEqual(live_session.status, LiveSession.Status.ACTIVE)
        self.assertEqual(live_session.current_question_index, 0)
        self.assertIsNotNone(live_session.question_started_at)
        self.assertFalse(live_session.current_question_closed)
        self.assertRedirects(response, reverse("host_lobby", args=[live_session.id]))


# ──────────────────────────────────────────────────────────────────────────────
# Question timer
# ──────────────────────────────────────────────────────────────────────────────

class QuestionTimerTests(TestCase):
    def test_answer_phase_open_within_time_limit(self):
        session, q, _ = _active_session_with_question(pin="CCCCC", time_limit=20)
        self.assertTrue(session.is_answer_phase_open())

    def test_answer_phase_closed_after_time_limit(self):
        session, q, _ = _active_session_with_question(pin="DDDDD", time_limit=20)
        session.question_started_at = timezone.now() - timedelta(seconds=25)
        session.save(update_fields=["question_started_at"])
        session.refresh_from_db()
        self.assertFalse(session.is_answer_phase_open())

    def test_answer_phase_closed_when_closed_flag_set(self):
        """is_answer_phase_open returns False as soon as current_question_closed=True,
        even if elapsed time is still within the limit."""
        session, q, _ = _active_session_with_question(pin="TTTTT", time_limit=20)
        session.current_question_closed = True
        session.save(update_fields=["current_question_closed"])
        session.refresh_from_db()
        self.assertFalse(session.is_answer_phase_open())

    def test_answer_phase_closed_when_session_not_active(self):
        quiz = _make_quiz()
        _make_question(quiz)
        session = LiveSession.objects.create(
            quiz=quiz, game_pin="EEEEE",
            status=LiveSession.Status.WAITING,
            current_question_index=0,
            question_started_at=timezone.now(),
        )
        self.assertFalse(session.is_answer_phase_open())

    def test_seconds_elapsed_grows_over_time(self):
        session, q, _ = _active_session_with_question(pin="FFFFF", time_limit=20)
        session.question_started_at = timezone.now() - timedelta(seconds=5)
        session.save(update_fields=["question_started_at"])
        session.refresh_from_db()
        elapsed = session.seconds_elapsed()
        self.assertGreaterEqual(elapsed, 5)
        self.assertLess(elapsed, 10)


# ──────────────────────────────────────────────────────────────────────────────
# Auto question-close (maybe_close_question)
# ──────────────────────────────────────────────────────────────────────────────

class AutoCloseTests(TestCase):
    def test_maybe_close_question_fires_when_timer_expired(self):
        """maybe_close_question returns True and sets the flag when time is up."""
        session, q, _ = _expired_session_with_question(pin="AC111")
        self.assertFalse(session.current_question_closed)

        result = maybe_close_question(session)

        self.assertTrue(result)
        session.refresh_from_db()
        self.assertTrue(session.current_question_closed)

    def test_maybe_close_question_does_not_fire_twice(self):
        """Second call returns False — close fires exactly once per question."""
        session, q, _ = _expired_session_with_question(pin="AC222")
        maybe_close_question(session)

        # Re-fetch so the flag is current
        session.refresh_from_db()
        result = maybe_close_question(session)

        self.assertFalse(result)

    def test_maybe_close_question_does_not_fire_before_timer_expires(self):
        """Returns False and does not set the flag when time remains."""
        session, q, _ = _active_session_with_question(pin="AC333", time_limit=20)
        result = maybe_close_question(session)

        self.assertFalse(result)
        session.refresh_from_db()
        self.assertFalse(session.current_question_closed)

    def test_state_api_triggers_auto_close_on_poll(self):
        """
        GET /api/sessions/<pin>/state/ must close the question and return
        question_closed=True when the timer has expired.
        """
        session, q, participant = _expired_session_with_question(pin="AC444")
        c = Client()
        c.cookies[f"kz_pt_{session.id}"] = participant.join_token

        resp = c.get(reverse("api_session_state", args=[session.game_pin]))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        # API must report the question as closed
        self.assertTrue(data["question_closed"])
        self.assertFalse(data["answer_phase_open"])

        # DB must be updated
        session.refresh_from_db()
        self.assertTrue(session.current_question_closed)

    def test_state_api_exposes_correct_answer_only_after_close(self):
        """correct_answer must be absent before close, present after."""
        # Before close — timer not expired
        session, q, participant = _active_session_with_question(pin="AC555")
        c = Client()
        c.cookies[f"kz_pt_{session.id}"] = participant.join_token

        resp_open = c.get(reverse("api_session_state", args=[session.game_pin]))
        data_open = resp_open.json()
        self.assertNotIn("correct_answer", data_open.get("question") or {})

        # Force close
        session.question_started_at = timezone.now() - timedelta(seconds=25)
        session.save(update_fields=["question_started_at"])

        resp_closed = c.get(reverse("api_session_state", args=[session.game_pin]))
        data_closed = resp_closed.json()
        self.assertTrue(data_closed["question_closed"])
        self.assertIn("correct_answer", data_closed.get("question") or {})
        self.assertEqual(data_closed["question"]["correct_answer"], q.correct_answer)

    def test_late_answer_rejected_after_auto_close(self):
        """A submission arriving after maybe_close_question has fired must be rejected."""
        session, q, participant = _expired_session_with_question(pin="AC666")
        # Trigger auto-close
        maybe_close_question(session)
        session.refresh_from_db()

        c = Client()
        c.cookies[f"kz_pt_{session.id}"] = participant.join_token

        resp = c.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "a"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("closed", resp.json()["detail"])

    def test_closed_flag_resets_on_next_question(self):
        """host_next_question must reset current_question_closed to False."""
        host = _get_or_create_default_host()
        quiz = _make_quiz(author=host)
        _make_question(quiz, "Q1", correct="a")
        _make_question(quiz, "Q2", correct="b")
        session = LiveSession.objects.create(
            quiz=quiz, game_pin="AC777",
            status=LiveSession.Status.ACTIVE,
            current_question_index=0,
            question_started_at=timezone.now() - timedelta(seconds=25),
            current_question_closed=True,
            host=host,
        )
        self.client.force_login(host)

        self.client.post(reverse("host_next_question", args=[session.id]))
        session.refresh_from_db()

        self.assertEqual(session.current_question_index, 1)
        self.assertFalse(session.current_question_closed)

    def test_closed_flag_reset_on_session_start(self):
        """start_live_session must initialise current_question_closed=False."""
        host = _get_or_create_default_host()
        quiz = _make_quiz(author=host)
        _make_question(quiz)
        session = LiveSession.objects.create(quiz=quiz, game_pin="AC888", host=host)
        self.client.force_login(host)

        self.client.post(reverse("start_live_session", args=[session.id]))
        session.refresh_from_db()

        self.assertFalse(session.current_question_closed)


# ──────────────────────────────────────────────────────────────────────────────
# Answer submission
# ──────────────────────────────────────────────────────────────────────────────

class AnswerSubmissionTests(TestCase):
    def _client_for_participant(self, participant, session):
        c = Client()
        c.cookies[f"kz_pt_{session.id}"] = participant.join_token
        return c

    def test_correct_answer_scores_1000_points(self):
        session, q, participant = _active_session_with_question(pin="G1111")
        client = self._client_for_participant(participant, session)
        resp = client.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": q.correct_answer}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("accepted"))
        self.assertNotIn("is_correct", data)
        self.assertNotIn("points_awarded", data)
        sub = AnswerSubmission.objects.get(participant=participant, question=q)
        self.assertTrue(sub.is_correct)
        self.assertEqual(sub.points_awarded, 1000)
        participant.refresh_from_db()
        self.assertEqual(participant.score, 1000)

    def test_incorrect_answer_scores_zero(self):
        session, q, participant = _active_session_with_question(pin="G2222")
        wrong = {"a": "b", "b": "c", "c": "d", "d": "a"}[q.correct_answer]
        client = self._client_for_participant(participant, session)
        resp = client.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": wrong}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("accepted"))
        self.assertNotIn("is_correct", data)
        sub = AnswerSubmission.objects.get(participant=participant, question=q)
        self.assertFalse(sub.is_correct)
        self.assertEqual(sub.points_awarded, 0)
        participant.refresh_from_db()
        self.assertEqual(participant.score, 0)

    def test_duplicate_answer_is_rejected(self):
        session, q, participant = _active_session_with_question(pin="G3333")
        client = self._client_for_participant(participant, session)
        payload = json.dumps({"selected_option": q.correct_answer})
        ct = "application/json"
        client.post(reverse("api_submit_answer", args=[session.game_pin]), data=payload, content_type=ct)
        resp2 = client.post(reverse("api_submit_answer", args=[session.game_pin]), data=payload, content_type=ct)
        self.assertEqual(resp2.status_code, 400)
        self.assertIn("already answered", resp2.json()["detail"])

    def test_expired_question_rejects_answer(self):
        session, q, participant = _expired_session_with_question(pin="G4444")
        client = self._client_for_participant(participant, session)
        resp = client.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "a"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("closed", resp.json()["detail"])

    def test_unauthorized_participant_cannot_submit(self):
        session, q, _ = _active_session_with_question(pin="G5555")
        resp = Client().post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "a"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_invalid_option_is_rejected(self):
        session, q, participant = _active_session_with_question(pin="G6666")
        client = self._client_for_participant(participant, session)
        resp = client.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "z"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_answer_not_accepted_when_session_waiting(self):
        quiz = _make_quiz()
        _make_question(quiz)
        session = LiveSession.objects.create(
            quiz=quiz, game_pin="G7777",
            status=LiveSession.Status.WAITING,
            current_question_index=0,
            question_started_at=timezone.now(),
        )
        participant = _make_participant(session)
        c = Client()
        c.cookies[f"kz_pt_{session.id}"] = participant.join_token
        resp = c.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "a"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)


# ──────────────────────────────────────────────────────────────────────────────
# Answer protection
# ──────────────────────────────────────────────────────────────────────────────

class AnswerProtectionTests(TestCase):
    def test_session_state_api_does_not_expose_correct_answer_while_open(self):
        """correct_answer must be absent from the state response while the question is open."""
        session, q, participant = _active_session_with_question(pin="H1111")
        c = Client()
        c.cookies[f"kz_pt_{session.id}"] = participant.join_token
        resp = c.get(reverse("api_session_state", args=[session.game_pin]))
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertFalse(body["question_closed"])
        self.assertNotIn("correct_answer", body.get("question") or {})
        # Belt-and-suspenders: not anywhere in the raw JSON
        self.assertNotIn('"correct_answer"', resp.content.decode())


# ──────────────────────────────────────────────────────────────────────────────
# Question progression
# ──────────────────────────────────────────────────────────────────────────────

class QuestionProgressionTests(TestCase):
    def setUp(self):
        self.host_user = _get_or_create_default_host()
        self.quiz = _make_quiz(author=self.host_user)
        _make_question(self.quiz, "Q1", correct="a")
        _make_question(self.quiz, "Q2", correct="b")
        _make_question(self.quiz, "Q3", correct="c")
        self.session = LiveSession.objects.create(
            quiz=self.quiz, game_pin="PPPPP",
            status=LiveSession.Status.ACTIVE,
            current_question_index=0,
            question_started_at=timezone.now(),
            host=self.host_user,
        )
        self.client.force_login(self.host_user)

    def test_current_question_returns_correct_object(self):
        questions = list(self.quiz.questions.order_by("id"))
        self.assertEqual(self.session.current_question(), questions[0])

    def test_next_question_advances_index(self):
        resp = self.client.post(reverse("host_next_question", args=[self.session.id]))
        self.session.refresh_from_db()
        self.assertEqual(self.session.current_question_index, 1)
        self.assertFalse(self.session.current_question_closed)
        self.assertRedirects(resp, reverse("host_lobby", args=[self.session.id]))

    def test_advancing_past_last_question_completes_session(self):
        self.session.current_question_index = 2
        self.session.save(update_fields=["current_question_index"])
        resp = self.client.post(reverse("host_next_question", args=[self.session.id]))
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, LiveSession.Status.COMPLETED)
        self.assertRedirects(resp, reverse("host_result_page", args=[self.session.id]))


# ──────────────────────────────────────────────────────────────────────────────
# Scoring
# ──────────────────────────────────────────────────────────────────────────────

class ScoringTests(TestCase):
    def _client_for(self, participant, session):
        c = Client()
        c.cookies[f"kz_pt_{session.id}"] = participant.join_token
        return c

    def test_score_accumulates_across_correct_answers(self):
        quiz = _make_quiz()
        _make_question(quiz, "Q1", correct="a")
        _make_question(quiz, "Q2", correct="b")

        session = LiveSession.objects.create(
            quiz=quiz, game_pin="SC111",
            status=LiveSession.Status.ACTIVE,
            current_question_index=0,
            question_started_at=timezone.now(),
        )
        participant = _make_participant(session)
        client = self._client_for(participant, session)

        client.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "a"}),
            content_type="application/json",
        )

        # Advance to Q2, resetting the closed flag as host_next_question would
        session.current_question_index = 1
        session.question_started_at = timezone.now()
        session.current_question_closed = False
        session.save(update_fields=["current_question_index", "question_started_at", "current_question_closed"])

        client.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "b"}),
            content_type="application/json",
        )

        participant.refresh_from_db()
        self.assertEqual(participant.score, 2000)

    def test_incorrect_answers_do_not_reduce_score(self):
        quiz = _make_quiz()
        _make_question(quiz, "Q1", correct="a")
        session = LiveSession.objects.create(
            quiz=quiz, game_pin="SC222",
            status=LiveSession.Status.ACTIVE,
            current_question_index=0,
            question_started_at=timezone.now(),
        )
        participant = _make_participant(session)
        client = self._client_for(participant, session)

        client.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "b"}),
            content_type="application/json",
        )
        participant.refresh_from_db()
        self.assertEqual(participant.score, 0)


# ──────────────────────────────────────────────────────────────────────────────
# Leaderboard ordering
# ──────────────────────────────────────────────────────────────────────────────

class LeaderboardTests(TestCase):
    def test_leaderboard_ordered_by_score_descending(self):
        quiz = _make_quiz()
        session = _make_session(quiz, pin="LB111", status=LiveSession.Status.COMPLETED)
        Participant.objects.create(live_session=session, display_name="Low", score=500)
        Participant.objects.create(live_session=session, display_name="High", score=3000)
        Participant.objects.create(live_session=session, display_name="Mid", score=1000)

        resp = self.client.get(reverse("api_leaderboard", args=[session.game_pin]))
        self.assertEqual(resp.status_code, 200)
        lb = resp.json()["leaderboard"]
        self.assertEqual(lb[0]["display_name"], "High")
        self.assertEqual(lb[1]["display_name"], "Mid")
        self.assertEqual(lb[2]["display_name"], "Low")
        self.assertEqual(lb[0]["rank"], 1)
        self.assertEqual(lb[1]["rank"], 2)
        self.assertEqual(lb[2]["rank"], 3)

    def test_own_entry_included_even_if_not_in_top_results(self):
        quiz = _make_quiz()
        session = _make_session(quiz, pin="LB222", status=LiveSession.Status.COMPLETED)
        participants = []
        for i, score in enumerate([5000, 4000, 3000, 2000, 1000, 500]):
            p = Participant.objects.create(
                live_session=session, display_name=f"P{i}", score=score
            )
            participants.append(p)

        last_participant = participants[-1]
        c = Client()
        c.cookies[f"kz_pt_{session.id}"] = last_participant.join_token

        resp = c.get(reverse("api_leaderboard", args=[session.game_pin]))
        data = resp.json()
        self.assertIsNotNone(data["own"])
        self.assertEqual(data["own"]["rank"], 6)


# ──────────────────────────────────────────────────────────────────────────────
# Session completion
# ──────────────────────────────────────────────────────────────────────────────

class SessionCompletionTests(TestCase):
    def test_completed_session_shows_host_result_page(self):
        host = _get_or_create_default_host()
        quiz = _make_quiz(author=host)
        session = _make_session(quiz, pin="COMPL", status=LiveSession.Status.COMPLETED)
        self.client.force_login(host)
        resp = self.client.get(reverse("host_result_page", args=[session.id]))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "window.__KOOZY_CONFIG__")
        self.assertContains(resp, "bundle.js")

    def test_host_result_api_returns_leaderboard(self):
        host = _get_or_create_default_host()
        quiz = _make_quiz(author=host)
        session = _make_session(quiz, pin="CMPL3", status=LiveSession.Status.COMPLETED)
        Participant.objects.create(live_session=session, display_name="Winner", score=2000)
        self.client.force_login(host)
        resp = self.client.get(reverse("api_host_result", args=[session.game_pin]))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["leaderboard"][0]["display_name"], "Winner")
        self.assertEqual(data["total_questions"], 0)


# ──────────────────────────────────────────────────────────────────────────────
# WebSocket lobby broadcasts
# ──────────────────────────────────────────────────────────────────────────────

class LobbyWebSocketTests(TransactionTestCase):
    def test_lobby_socket_broadcasts_updated_participant_state(self):
        quiz = Quiz.objects.create(
            title="Socket quiz", description="", category="Test", difficulty="easy"
        )
        live_session = LiveSession.objects.create(quiz=quiz, game_pin="ABCDE")
        Participant.objects.create(live_session=live_session, display_name="Avery")

        def add_participant_and_publish():
            session = LiveSession.objects.get(id=live_session.id)
            Participant.objects.create(live_session=session, display_name="Blake")
            publish_lobby_state(session)

        def start_and_publish():
            session = LiveSession.objects.get(id=live_session.id)
            session.status = LiveSession.Status.ACTIVE
            session.save(update_fields=["status"])
            publish_lobby_state(session)

        async def connect_and_receive():
            communicator = WebsocketCommunicator(
                application, "/ws/live-sessions/ABCDE/lobby/"
            )
            connected, _ = await communicator.connect()
            initial_payload = await communicator.receive_json_from()
            await database_sync_to_async(add_participant_and_publish)()
            updated_payload = await communicator.receive_json_from()
            await database_sync_to_async(start_and_publish)()
            started_payload = await communicator.receive_json_from()
            await communicator.disconnect()
            return connected, initial_payload, updated_payload, started_payload

        connected, payload, updated_payload, started_payload = async_to_sync(
            connect_and_receive
        )()
        self.assertTrue(connected)
        self.assertEqual(payload["status"], LiveSession.Status.WAITING)
        self.assertEqual(payload["participant_count"], 1)
        self.assertEqual([p["display_name"] for p in payload["participants"]], ["Avery"])
        self.assertIn("id", payload["participants"][0])
        self.assertEqual(updated_payload["participant_count"], 2)
        self.assertEqual([p["display_name"] for p in updated_payload["participants"]], ["Avery", "Blake"])
        self.assertEqual(started_payload["status"], LiveSession.Status.ACTIVE)


# ──────────────────────────────────────────────────────────────────────────────
# V1 Requirement 1: Independent Participants
# ──────────────────────────────────────────────────────────────────────────────

class IndependentParticipantsTests(TestCase):
    def test_multiple_browsers_join_as_independent_participants(self):
        """Different browser clients joining the same Game PIN have separate identities,
        cookies, and answer states. One browser never inherits another's identity."""
        quiz = _make_quiz()
        _make_question(quiz, "Q1", correct="a")
        session = LiveSession.objects.create(quiz=quiz, game_pin="MULTI")

        # Client A joins as Alice
        client_a = Client()
        resp_a = client_a.post(
            reverse("participant_join", args=[session.game_pin]),
            {"display_name": "Alice"},
        )
        self.assertEqual(resp_a.status_code, 302)
        self.assertIn("pt=", resp_a.url)
        self.assertIn(f"kz_pt_{session.id}", client_a.cookies)
        token_a = client_a.cookies[f"kz_pt_{session.id}"].value

        # Client B joins as Bob
        client_b = Client()
        resp_b = client_b.post(
            reverse("participant_join", args=[session.game_pin]),
            {"display_name": "Bob"},
        )
        self.assertEqual(resp_b.status_code, 302)
        self.assertIn("pt=", resp_b.url)
        self.assertIn(f"kz_pt_{session.id}", client_b.cookies)
        token_b = client_b.cookies[f"kz_pt_{session.id}"].value

        # Verify distinct tokens and separate participants
        self.assertNotEqual(token_a, token_b)
        self.assertEqual(session.participants.count(), 2)
        participant_a = Participant.objects.get(join_token=token_a)
        participant_b = Participant.objects.get(join_token=token_b)
        self.assertEqual(participant_a.display_name, "Alice")
        self.assertEqual(participant_b.display_name, "Bob")

        # Client C opens the session without joining - must NOT have any participant identity
        client_c = Client()
        state_c = client_c.get(reverse("api_session_state", args=[session.game_pin])).json()
        self.assertIsNone(state_c.get("participant"))

        # Start session
        session.status = LiveSession.Status.ACTIVE
        session.current_question_index = 0
        session.question_started_at = timezone.now()
        session.save(update_fields=["status", "current_question_index", "question_started_at"])

        # Client A submits 'a', Client B submits 'b'
        resp_sub_a = client_a.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "a"}),
            content_type="application/json",
            HTTP_X_PARTICIPANT_TOKEN=token_a,
        )
        self.assertEqual(resp_sub_a.status_code, 200)

        resp_sub_b = client_b.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "b"}),
            content_type="application/json",
            HTTP_X_PARTICIPANT_TOKEN=token_b,
        )
        self.assertEqual(resp_sub_b.status_code, 200)

        # Refreshing Client A sees Alice's state
        state_a = client_a.get(
            reverse("api_session_state", args=[session.game_pin]),
            HTTP_X_PARTICIPANT_TOKEN=token_a,
        ).json()
        self.assertEqual(state_a["participant"]["display_name"], "Alice")
        self.assertEqual(state_a["participant"]["submitted_option"], "a")

        # Refreshing Client B sees Bob's state
        state_b = client_b.get(
            reverse("api_session_state", args=[session.game_pin]),
            HTTP_X_PARTICIPANT_TOKEN=token_b,
        ).json()
        self.assertEqual(state_b["participant"]["display_name"], "Bob")
        self.assertEqual(state_b["participant"]["submitted_option"], "b")

    def test_shared_browser_tabs_independent_participant_tokens(self):
        """Simulate multiple tabs in the same browser sharing the cookie jar:
        - Tab A joins as Alice (sets cookie kz_pt_X)
        - Tab B visits /join/<pin>/ with Alice's cookie present
        - Tab B is NOT auto-redirected; joins as Bob
        - Tab B receives Bob's join token and uses X-Participant-Token
        - Answers and states remain completely independent
        """
        quiz = _make_quiz()
        _make_question(quiz, "What is 2+2?", correct="a")
        session = LiveSession.objects.create(quiz=quiz, game_pin="TABS1")

        browser = Client()

        # Tab A joins as Alice
        resp_tab_a = browser.post(
            reverse("participant_join", args=[session.game_pin]),
            {"display_name": "Alice"},
        )
        self.assertEqual(resp_tab_a.status_code, 302)
        token_alice = Participant.objects.get(display_name="Alice", live_session=session).join_token

        # Tab B in SAME browser (cookie is present) visits join page
        # Must show the form, NOT auto-redirect to Alice's lobby
        resp_join_b = browser.get(reverse("participant_join", args=[session.game_pin]))
        self.assertEqual(resp_join_b.status_code, 200)
        self.assertContains(resp_join_b, "Choose the name other participants will see.")

        # Tab B joins as Bob
        resp_tab_b = browser.post(
            reverse("participant_join", args=[session.game_pin]),
            {"display_name": "Bob"},
        )
        self.assertEqual(resp_tab_b.status_code, 302)
        token_bob = Participant.objects.get(display_name="Bob", live_session=session).join_token
        self.assertIn(f"pt={token_bob}", resp_tab_b.url)
        self.assertNotEqual(token_alice, token_bob)

        # Tab C joins as Charlie
        resp_tab_c = browser.post(
            reverse("participant_join", args=[session.game_pin]),
            {"display_name": "Charlie"},
        )
        self.assertEqual(resp_tab_c.status_code, 302)
        token_charlie = Participant.objects.get(display_name="Charlie", live_session=session).join_token
        self.assertEqual(session.participants.count(), 3)

        # Start live session
        session.status = LiveSession.Status.ACTIVE
        session.current_question_index = 0
        session.question_started_at = timezone.now()
        session.save(update_fields=["status", "current_question_index", "question_started_at"])

        # Tab A (Alice) answers 'a' using X-Participant-Token
        sub_a = browser.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "a"}),
            content_type="application/json",
            HTTP_X_PARTICIPANT_TOKEN=token_alice,
        ).json()
        self.assertTrue(sub_a["accepted"])

        # Tab B (Bob) answers 'b' using X-Participant-Token
        sub_b = browser.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "b"}),
            content_type="application/json",
            HTTP_X_PARTICIPANT_TOKEN=token_bob,
        ).json()
        self.assertTrue(sub_b["accepted"])

        # Tab C (Charlie) answers 'c' using X-Participant-Token
        sub_c = browser.post(
            reverse("api_submit_answer", args=[session.game_pin]),
            data=json.dumps({"selected_option": "c"}),
            content_type="application/json",
            HTTP_X_PARTICIPANT_TOKEN=token_charlie,
        ).json()
        self.assertTrue(sub_c["accepted"])

        # Verify state for each tab independently
        state_alice = browser.get(
            reverse("api_session_state", args=[session.game_pin]),
            HTTP_X_PARTICIPANT_TOKEN=token_alice,
        ).json()
        self.assertEqual(state_alice["participant"]["display_name"], "Alice")
        self.assertEqual(state_alice["participant"]["submitted_option"], "a")

        state_bob = browser.get(
            reverse("api_session_state", args=[session.game_pin]),
            HTTP_X_PARTICIPANT_TOKEN=token_bob,
        ).json()
        self.assertEqual(state_bob["participant"]["display_name"], "Bob")
        self.assertEqual(state_bob["participant"]["submitted_option"], "b")

        state_charlie = browser.get(
            reverse("api_session_state", args=[session.game_pin]),
            HTTP_X_PARTICIPANT_TOKEN=token_charlie,
        ).json()
        self.assertEqual(state_charlie["participant"]["display_name"], "Charlie")
        self.assertEqual(state_charlie["participant"]["submitted_option"], "c")

        # Refreshing HTML play page with ?pt= preserves participant identity
        play_alice = browser.get(
            f"{reverse('participant_play', args=[session.game_pin])}?pt={token_alice}"
        )
        self.assertEqual(play_alice.status_code, 200)
        self.assertContains(play_alice, "Alice")

        play_bob = browser.get(
            f"{reverse('participant_play', args=[session.game_pin])}?pt={token_bob}"
        )
        self.assertEqual(play_bob.status_code, 200)
        self.assertContains(play_bob, "Bob")


# ──────────────────────────────────────────────────────────────────────────────
# V1 Requirement 2: Question Validation
# ──────────────────────────────────────────────────────────────────────────────

class QuestionValidationTests(TestCase):
    def test_question_form_requires_correct_answer(self):
        from .forms import QuestionForm
        form = QuestionForm(data={
            "question_text": "Sample question",
            "option_a": "A",
            "option_b": "B",
            "option_c": "C",
            "option_d": "D",
            "correct_answer": "",
        })
        self.assertFalse(form.is_valid())
        self.assertIn("correct_answer", form.errors)

    def test_question_form_requires_valid_options_and_text(self):
        from .forms import QuestionForm
        form = QuestionForm(data={
            "question_text": "   ",
            "option_a": "",
            "option_b": "B",
            "option_c": "C",
            "option_d": "D",
            "correct_answer": "a",
        })
        self.assertFalse(form.is_valid())
        self.assertIn("question_text", form.errors)
        self.assertIn("option_a", form.errors)

    def test_question_is_valid_helper(self):
        quiz = _make_quiz()
        valid_q = _make_question(quiz, "What is Python?", correct="a")
        self.assertTrue(valid_q.is_valid())

        invalid_q = Question(
            quiz=quiz,
            question_text="",
            option_a="A",
            option_b="B",
            option_c="C",
            option_d="D",
            correct_answer="a",
        )
        self.assertFalse(invalid_q.is_valid())

        invalid_correct = Question(
            quiz=quiz,
            question_text="Q?",
            option_a="A",
            option_b="B",
            option_c="C",
            option_d="D",
            correct_answer="z",
        )
        self.assertFalse(invalid_correct.is_valid())

    def test_session_cannot_start_with_empty_quiz(self):
        quiz = _make_quiz()
        session = LiveSession.objects.create(quiz=quiz, game_pin="EMPTY")
        sess = self.client.session
        sess["host_quiz_ids"] = [quiz.id]
        sess.save()

        resp = self.client.post(reverse("start_live_session", args=[session.id]))
        session.refresh_from_db()
        self.assertEqual(session.status, LiveSession.Status.WAITING)

    def test_session_cannot_start_with_invalid_question(self):
        quiz = _make_quiz()
        # Question with invalid correct answer
        q = Question.objects.create(
            quiz=quiz,
            question_text="Malformed Q",
            option_a="A", option_b="B", option_c="C", option_d="D",
            correct_answer="x",
        )
        session = LiveSession.objects.create(quiz=quiz, game_pin="MALF1")
        sess = self.client.session
        sess["host_quiz_ids"] = [quiz.id]
        sess.save()

        resp = self.client.post(reverse("start_live_session", args=[session.id]))
        session.refresh_from_db()
        self.assertEqual(session.status, LiveSession.Status.WAITING)


# ──────────────────────────────────────────────────────────────────────────────
# V1 Requirement 3, 4, 5, 6, 7: End-to-End V1 Flow
# ──────────────────────────────────────────────────────────────────────────────

class EndToEndV1FlowTests(TestCase):
    def test_complete_host_and_multiplayer_participant_flow(self):
        # 1. Host creates quiz
        host_user = _get_or_create_default_host()
        host_client = Client()
        host_client.force_login(host_user)
        resp_create = host_client.post(
            reverse("create_quiz"),
            {
                "title": "V1 Ultimate Quiz",
                "description": "Multiplayer test",
                "category": "Trivia",
                "difficulty": "medium",
            },
        )
        quiz = Quiz.objects.get(title="V1 Ultimate Quiz")
        self.assertRedirects(resp_create, reverse("add_question", args=[quiz.id]))

        # 2. Host adds 2 questions
        host_client.post(
            reverse("add_question", args=[quiz.id]),
            {
                "question_text": "What is 2 + 2?",
                "option_a": "4", "option_b": "3", "option_c": "5", "option_d": "22",
                "correct_answer": "a",
            },
        )
        host_client.post(
            reverse("add_question", args=[quiz.id]),
            {
                "question_text": "Capital of France?",
                "option_a": "London", "option_b": "Paris", "option_c": "Berlin", "option_d": "Rome",
                "correct_answer": "b",
            },
        )
        self.assertEqual(quiz.questions.count(), 2)

        # 3. Host creates session & gets Game PIN
        resp_session = host_client.post(reverse("create_live_session", args=[quiz.id]))
        session = LiveSession.objects.get(quiz=quiz)
        self.assertRedirects(resp_session, reverse("host_lobby", args=[session.id]))
        pin = session.game_pin

        # 4. Two participants join: Player 1 (Maya) and Player 2 (Sam)
        client_p1 = Client()
        client_p1.post(reverse("participant_join", args=[pin]), {"display_name": "Maya"})
        client_p2 = Client()
        client_p2.post(reverse("participant_join", args=[pin]), {"display_name": "Sam"})
        self.assertEqual(session.participants.count(), 2)

        # 5. Host starts quiz
        host_client.post(reverse("start_live_session", args=[session.id]))
        session.refresh_from_db()
        self.assertEqual(session.status, LiveSession.Status.ACTIVE)
        self.assertEqual(session.current_question_index, 0)
        self.assertFalse(session.current_question_closed)

        # 6. Participants fetch Q1 state (no correct answer leaked)
        p1_state = client_p1.get(reverse("api_session_state", args=[pin])).json()
        self.assertEqual(p1_state["current_question_index"], 0)
        self.assertEqual(p1_state["question"]["question_text"], "What is 2 + 2?")
        self.assertNotIn("correct_answer", p1_state["question"])
        self.assertTrue(p1_state["answer_phase_open"])

        # 7. Maya answers correctly ('a'), Sam answers incorrectly ('c')
        sub1 = client_p1.post(
            reverse("api_submit_answer", args=[pin]),
            data=json.dumps({"selected_option": "a"}),
            content_type="application/json",
        ).json()
        self.assertTrue(sub1["accepted"])
        self.assertNotIn("is_correct", sub1)

        sub2 = client_p2.post(
            reverse("api_submit_answer", args=[pin]),
            data=json.dumps({"selected_option": "c"}),
            content_type="application/json",
        ).json()
        self.assertTrue(sub2["accepted"])

        # During active question, state does NOT expose score changes or correct answer
        mid_state = client_p1.get(reverse("api_session_state", args=[pin])).json()
        self.assertEqual(mid_state["participant"]["score"], 0)
        self.assertNotIn("correct_answer", mid_state["question"])

        # 8. Host closes Q1 / Answer phase ends (reveal phase)
        host_client.post(reverse("host_close_question", args=[session.id]))
        session.refresh_from_db()
        self.assertTrue(session.current_question_closed)

        # In reveal phase, state exposes correct answer and scored leaderboard
        reveal_state_p1 = client_p1.get(reverse("api_session_state", args=[pin])).json()
        self.assertTrue(reveal_state_p1["question_closed"])
        self.assertEqual(reveal_state_p1["question"]["correct_answer"], "a")
        self.assertEqual(reveal_state_p1["participant"]["score"], 1000)

        # 9. Host advances to Q2
        host_client.post(reverse("host_next_question", args=[session.id]))
        session.refresh_from_db()
        self.assertEqual(session.current_question_index, 1)
        self.assertFalse(session.current_question_closed)

        # Participants receive Q2
        p1_q2 = client_p1.get(reverse("api_session_state", args=[pin])).json()
        self.assertEqual(p1_q2["current_question_index"], 1)
        self.assertEqual(p1_q2["question"]["question_text"], "Capital of France?")
        self.assertNotIn("correct_answer", p1_q2["question"])

        # Both answer Q2 correctly ('b')
        client_p1.post(
            reverse("api_submit_answer", args=[pin]),
            data=json.dumps({"selected_option": "b"}),
            content_type="application/json",
        )
        client_p2.post(
            reverse("api_submit_answer", args=[pin]),
            data=json.dumps({"selected_option": "b"}),
            content_type="application/json",
        )

        # Close Q2
        host_client.post(reverse("host_close_question", args=[session.id]))

        # 10. Host advances past Q2 -> completes session
        resp_finish = host_client.post(reverse("host_next_question", args=[session.id]))
        session.refresh_from_db()
        self.assertEqual(session.status, LiveSession.Status.COMPLETED)
        self.assertRedirects(resp_finish, reverse("host_result_page", args=[session.id]))

        # 11. Final Leaderboard & Result verification
        lb_resp = host_client.get(reverse("api_host_result", args=[pin])).json()
        self.assertEqual(lb_resp["leaderboard"][0]["display_name"], "Maya")
        self.assertEqual(lb_resp["leaderboard"][0]["score"], 2000)
        self.assertEqual(lb_resp["leaderboard"][1]["display_name"], "Sam")
        self.assertEqual(lb_resp["leaderboard"][1]["score"], 1000)

        # Maya checks participant result endpoint
        maya_res = client_p1.get(reverse("api_participant_result", args=[pin])).json()
        self.assertEqual(maya_res["correct_count"], 2)
        self.assertEqual(maya_res["score"], 2000)
        self.assertEqual(maya_res["rank"], 1)
        self.assertEqual(len(maya_res["answers"]), 2)

        # Sam checks participant result endpoint
        sam_res = client_p2.get(reverse("api_participant_result", args=[pin])).json()
        self.assertEqual(sam_res["correct_count"], 1)
        self.assertEqual(sam_res["score"], 1000)
        self.assertEqual(sam_res["rank"], 2)


# ──────────────────────────────────────────────────────────────────────────────
# V1 Batch Quiz Submission & Global Timer Tests
# ──────────────────────────────────────────────────────────────────────────────

class V1BatchSubmissionAndGlobalTimerTests(TestCase):
    def setUp(self):
        self.host_user = _get_or_create_default_host()
        self.quiz = Quiz.objects.create(title="V1 Speed Quiz", time_limit=300, author=self.host_user)
        self.q1 = _make_question(self.quiz, "Q1 Text", correct="a")
        self.q2 = _make_question(self.quiz, "Q2 Text", correct="b")
        self.q3 = _make_question(self.quiz, "Q3 Text", correct="c")

        self.session = LiveSession.objects.create(
            quiz=self.quiz,
            game_pin="V1PIN",
            status=LiveSession.Status.ACTIVE,
            total_time_limit=300,
            quiz_started_at=timezone.now(),
            host=self.host_user,
        )

        self.p1 = Participant.objects.create(
            live_session=self.session,
            display_name="Participant 1",
            join_token="p1_token_12345",
        )
        self.p2 = Participant.objects.create(
            live_session=self.session,
            display_name="Participant 2",
            join_token="p2_token_67890",
        )

    def test_batch_submission_calculates_score_and_prevents_duplicate(self):
        client = Client()
        # Submit complete answers for Q1 (correct), Q2 (correct), Q3 (incorrect)
        resp = client.post(
            reverse("api_submit_quiz_answers", args=[self.session.game_pin]),
            data=json.dumps({
                "answers": {
                    str(self.q1.id): "a",
                    str(self.q2.id): "b",
                    str(self.q3.id): "a",  # incorrect
                }
            }),
            content_type="application/json",
            HTTP_X_PARTICIPANT_TOKEN=self.p1.join_token,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["accepted"])
        self.assertEqual(data["score"], 2000)
        self.assertEqual(data["correct_count"], 2)
        self.assertEqual(data["total_questions"], 3)
        self.assertEqual(data["accuracy"], 67)

        self.p1.refresh_from_db()
        self.assertEqual(self.p1.score, 2000)
        self.assertIsNotNone(self.p1.submitted_at)

        # Duplicate submission must be rejected
        dup_resp = client.post(
            reverse("api_submit_quiz_answers", args=[self.session.game_pin]),
            data=json.dumps({
                "answers": {str(self.q1.id): "a"}
            }),
            content_type="application/json",
            HTTP_X_PARTICIPANT_TOKEN=self.p1.join_token,
        )
        self.assertEqual(dup_resp.status_code, 400)
        self.assertIn("already submitted", dup_resp.json()["detail"])

    def test_state_endpoint_unlocks_all_questions_for_active_quiz(self):
        client = Client()
        resp = client.get(
            reverse("api_session_state", args=[self.session.game_pin]),
            HTTP_X_PARTICIPANT_TOKEN=self.p1.join_token,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "ACTIVE")
        self.assertEqual(len(data["questions"]), 3)
        # Questions do NOT expose correct_answer before submission
        self.assertNotIn("correct_answer", data["questions"][0])

    def test_host_kick_participant_endpoint(self):
        client = Client()
        client.force_login(self.host_user)
        resp = client.post(
            reverse("api_host_kick_participant", args=[self.session.game_pin]),
            data=json.dumps({"participant_id": self.p2.id}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["kicked"])

        self.p2.refresh_from_db()
        self.assertTrue(self.p2.is_kicked)

        # Kicked participant state check
        state_resp = client.get(
            reverse("api_session_state", args=[self.session.game_pin]),
            HTTP_X_PARTICIPANT_TOKEN=self.p2.join_token,
        )
        # Excluded from active participants list
        data = state_resp.json()
        active_ids = [p["id"] for p in data["participants"]]
        self.assertNotIn(self.p2.id, active_ids)

    def test_host_end_quiz_completes_session(self):
        client = Client()
        client.force_login(self.host_user)
        resp = client.post(
            reverse("api_host_end_quiz", args=[self.session.game_pin]),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "COMPLETED")

        self.session.refresh_from_db()
        self.assertEqual(self.session.status, LiveSession.Status.COMPLETED)
        self.assertIsNotNone(self.session.ended_at)


# ──────────────────────────────────────────────────────────────────────────────
# All React Route Integration Tests
# ──────────────────────────────────────────────────────────────────────────────

class AllReactRouteTests(TestCase):
    def setUp(self):
        self.host_user = _get_or_create_default_host()
        self.quiz = Quiz.objects.create(title="Django React Quiz", time_limit=300, author=self.host_user)
        self.q1 = _make_question(self.quiz, "Q1 Text", correct="a")
        self.session = LiveSession.objects.create(
            quiz=self.quiz,
            game_pin="REACT",
            status=LiveSession.Status.WAITING,
            host=self.host_user,
        )
        self.participant = Participant.objects.create(
            live_session=self.session,
            display_name="Tester",
            join_token="react_tester_token",
        )

    def test_home_page_renders_react_app(self):
        resp = self.client.get(reverse("home"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "bundle.js")
        self.assertContains(resp, "bundle.css")
        self.assertContains(resp, '<div id="root"></div>')
        self.assertContains(resp, '"page": "home"')

    def test_join_page_renders_react_app(self):
        resp = self.client.get(reverse("join_game"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "bundle.js")
        self.assertContains(resp, '<div id="root"></div>')
        self.assertContains(resp, '"page": "join"')

    def test_join_pin_page_renders_react_app(self):
        resp = self.client.get(reverse("participant_join", args=["REACT"]))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "bundle.js")
        self.assertContains(resp, '<div id="root"></div>')
        self.assertContains(resp, '"page": "join_pin"')

    def test_participant_lobby_renders_react_app(self):
        c = Client()
        c.cookies[f"kz_pt_{self.session.id}"] = self.participant.join_token
        resp = c.get(reverse("participant_lobby", args=["REACT"]))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "bundle.js")
        self.assertContains(resp, '<div id="root"></div>')
        self.assertContains(resp, '"page": "participant_session"')

    def test_participant_play_renders_react_app(self):
        c = Client()
        c.cookies[f"kz_pt_{self.session.id}"] = self.participant.join_token
        resp = c.get(reverse("participant_play", args=["REACT"]))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "bundle.js")
        self.assertContains(resp, '<div id="root"></div>')
        self.assertContains(resp, '"page": "participant_session"')

    def test_participant_result_renders_react_app(self):
        self.session.status = LiveSession.Status.COMPLETED
        self.session.save(update_fields=["status"])
        c = Client()
        c.cookies[f"kz_pt_{self.session.id}"] = self.participant.join_token
        resp = c.get(reverse("participant_result_page", args=["REACT"]))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "bundle.js")
        self.assertContains(resp, '<div id="root"></div>')
        self.assertContains(resp, '"page": "participant_session"')

    def test_host_quiz_list_renders_react_app(self):
        self.client.force_login(self.host_user)
        resp = self.client.get(reverse("host_quiz_list"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "bundle.js")
        self.assertContains(resp, '<div id="root"></div>')
        self.assertContains(resp, '"page": "host_quiz_list"')

    def test_create_quiz_renders_react_app(self):
        self.client.force_login(self.host_user)
        resp = self.client.get(reverse("create_quiz"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "bundle.js")
        self.assertContains(resp, '<div id="root"></div>')
        self.assertContains(resp, '"page": "create_quiz"')

    def test_add_question_renders_react_app(self):
        self.client.force_login(self.host_user)
        resp = self.client.get(reverse("add_question", args=[self.quiz.id]))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "bundle.js")
        self.assertContains(resp, '<div id="root"></div>')
        self.assertContains(resp, '"page": "add_question"')

    def test_host_session_renders_react_app(self):
        self.client.force_login(self.host_user)
        resp = self.client.get(reverse("host_lobby", args=[self.session.id]))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "bundle.js")
        self.assertContains(resp, '<div id="root"></div>')
        self.assertContains(resp, '"page": "host_session"')


# ──────────────────────────────────────────────────────────────────────────────
# V1 Closure Specifications & Regressions
# ──────────────────────────────────────────────────────────────────────────────

class V1ClosureSpecificationTests(TestCase):
    def setUp(self):
        self.teacher, _ = User.objects.get_or_create(
            username="teacher1@koozy.edu",
            defaults={"email": "teacher1@koozy.edu", "first_name": "Prof. Smith"}
        )
        self.quiz = Quiz.objects.create(
            title="Closure Quiz",
            description="Testing V1 closure specs",
            category="Testing",
            difficulty="easy",
            time_limit=300,
            author=self.teacher,
        )
        self.q1 = Question.objects.create(
            quiz=self.quiz,
            question_text="Q1?",
            option_a="1A",
            option_b="1B",
            option_c="1C",
            option_d="1D",
            correct_answer="a",
            order=1,
        )
        self.q2 = Question.objects.create(
            quiz=self.quiz,
            question_text="Q2?",
            option_a="2A",
            option_b="2B",
            option_c="2C",
            option_d="2D",
            correct_answer="b",
            order=2,
        )
        self.client.force_login(self.teacher)

    def test_single_active_live_session_per_teacher(self):
        # Create session 1
        resp1 = self.client.post(reverse("api_create_live_session", args=[self.quiz.id]))
        self.assertEqual(resp1.status_code, 201)
        sess1_pin = resp1.json()["game_pin"]
        sess1 = LiveSession.objects.get(game_pin=sess1_pin)
        self.assertEqual(sess1.status, LiveSession.Status.WAITING)

        # Create session 2 for same teacher
        resp2 = self.client.post(reverse("api_create_live_session", args=[self.quiz.id]))
        self.assertEqual(resp2.status_code, 201)
        sess2_pin = resp2.json()["game_pin"]

        # Verify session 1 was automatically completed
        sess1.refresh_from_db()
        self.assertEqual(sess1.status, LiveSession.Status.COMPLETED)
        sess2 = LiveSession.objects.get(game_pin=sess2_pin)
        self.assertEqual(sess2.status, LiveSession.Status.WAITING)

    def test_late_joiner_pending_admission_and_host_admit_flow(self):
        session = LiveSession.objects.create(
            quiz=self.quiz,
            host=self.teacher,
            status=LiveSession.Status.ACTIVE,
            total_time_limit=300,
            quiz_started_at=timezone.now(),
        )

        # Student joins ACTIVE session -> is_admitted should be False (pending)
        join_resp = self.client.post(
            reverse("api_join_game"),
            {"game_pin": session.game_pin, "display_name": "LateStudent"},
            content_type="application/json",
        )
        self.assertEqual(join_resp.status_code, 201)
        data = join_resp.json()
        self.assertFalse(data["is_admitted"])
        student = Participant.objects.get(live_session=session, display_name="LateStudent")
        self.assertFalse(student.is_admitted)

        # Host checks session_state -> should see pending participant
        state_resp = self.client.get(reverse("api_session_state", args=[session.game_pin]))
        state_data = state_resp.json()
        self.assertEqual(state_data["pending_count"], 1)
        self.assertEqual(state_data["pending_participants"][0]["display_name"], "LateStudent")

        # Host admits student
        admit_resp = self.client.post(
            reverse("api_host_admit_participant", args=[session.game_pin]),
            {"participant_id": student.id},
            content_type="application/json",
        )
        self.assertEqual(admit_resp.status_code, 200)
        student.refresh_from_db()
        self.assertTrue(student.is_admitted)

    def test_host_early_end_quiz_locks_submissions(self):
        session = LiveSession.objects.create(
            quiz=self.quiz,
            host=self.teacher,
            status=LiveSession.Status.ACTIVE,
            total_time_limit=300,
            quiz_started_at=timezone.now(),
        )
        p = Participant.objects.create(live_session=session, display_name="EarlyStudent", is_admitted=True)

        # Host ends quiz early
        end_resp = self.client.post(reverse("api_host_end_quiz", args=[session.game_pin]))
        self.assertEqual(end_resp.status_code, 200)
        session.refresh_from_db()
        self.assertEqual(session.status, LiveSession.Status.COMPLETED)

    def test_json_export_format(self):
        resp = self.client.get(reverse("api_export_quiz", args=[self.quiz.id]))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["title"], "Closure Quiz")
        self.assertEqual(len(data["questions"]), 2)
        self.assertEqual(data["questions"][0]["question"], "Q1?")
        self.assertEqual(data["questions"][0]["options"]["A"], "1A")
        self.assertEqual(data["questions"][0]["correct_answer"], "A")

    def test_json_import_valid_and_invalid(self):
        # Valid import
        valid_payload = {
            "title": "Imported Biology Quiz",
            "description": "Cell structure",
            "category": "Science",
            "difficulty": "medium",
            "time_limit": 180,
            "questions": [
                {
                    "question": "What is the powerhouse of the cell?",
                    "options": {
                        "A": "Mitochondria",
                        "B": "Nucleus",
                        "C": "Ribosome",
                        "D": "Endoplasmic Reticulum"
                    },
                    "correct_answer": "A"
                }
            ]
        }
        resp = self.client.post(
            reverse("api_import_quiz"),
            valid_payload,
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201)
        imported_id = resp.json()["id"]
        imported_quiz = Quiz.objects.get(id=imported_id)
        self.assertEqual(imported_quiz.title, "Imported Biology Quiz")
        self.assertEqual(imported_quiz.author, self.teacher)
        self.assertEqual(imported_quiz.questions.count(), 1)

        # Invalid import: missing questions
        resp_invalid = self.client.post(
            reverse("api_import_quiz"),
            {"title": "Empty Quiz"},
            content_type="application/json",
        )
        self.assertEqual(resp_invalid.status_code, 400)

        # Invalid import: invalid correct_answer
        resp_invalid_corr = self.client.post(
            reverse("api_import_quiz"),
            {
                "title": "Bad Answer",
                "questions": [{
                    "question": "Test?",
                    "options": {"A": "1", "B": "2", "C": "3", "D": "4"},
                    "correct_answer": "Z"
                }]
            },
            content_type="application/json",
        )
        self.assertEqual(resp_invalid_corr.status_code, 400)

    def test_question_reordering_endpoint(self):
        # Initial order: q1 (id1), q2 (id2)
        resp = self.client.post(
            reverse("api_reorder_questions", args=[self.quiz.id]),
            {"question_ids": [self.q2.id, self.q1.id]},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        self.q1.refresh_from_db()
        self.q2.refresh_from_db()
        self.assertEqual(self.q2.order, 1)
        self.assertEqual(self.q1.order, 2)
        questions = list(self.quiz.questions.all())
        self.assertEqual(questions[0].id, self.q2.id)
        self.assertEqual(questions[1].id, self.q1.id)

    def test_kicked_participant_blocked_from_rejoining(self):
        session = LiveSession.objects.create(
            quiz=self.quiz,
            status=LiveSession.Status.WAITING,
            total_time_limit=300,
        )
        p = Participant.objects.create(live_session=session, display_name="TrollUser", is_kicked=True)
        resp = self.client.post(
            reverse("api_join_game"),
            {"game_pin": session.game_pin, "display_name": "TrollUser"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_add_question_correct_option_selection(self):
        # Host adds question with option B as correct answer
        resp = self.client.post(
            reverse("api_add_question", args=[self.quiz.id]),
            {
                "question_text": "What is 2+2?",
                "option_a": "3",
                "option_b": "4",
                "option_c": "5",
                "option_d": "6",
                "correct_answer": "b",
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["question"]["correct_answer"], "b")

        # Invalid option rejected
        resp_invalid = self.client.post(
            reverse("api_add_question", args=[self.quiz.id]),
            {
                "question_text": "What is 3+3?",
                "option_a": "3",
                "option_b": "4",
                "option_c": "5",
                "option_d": "6",
                "correct_answer": "e",
            },
            content_type="application/json",
        )
        self.assertEqual(resp_invalid.status_code, 400)

    def test_export_quiz_returns_actual_json(self):
        resp = self.client.get(
            reverse("api_export_quiz", args=[self.quiz.id]),
            HTTP_ACCEPT="text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.headers.get("Content-Type", "").startswith("application/json"))
        # Parse content as actual JSON (not HTML)
        data = json.loads(resp.content.decode("utf-8"))
        self.assertEqual(data["title"], self.quiz.title)
        self.assertIn("questions", data)

    def test_join_game_sets_cookie(self):
        session = LiveSession.objects.create(
            quiz=self.quiz,
            status=LiveSession.Status.WAITING,
            total_time_limit=300,
        )
        resp = self.client.post(
            reverse("api_join_game"),
            {"game_pin": session.game_pin, "display_name": "CookieUser"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201)
        cookie_name = f"kz_pt_{session.id}"
        self.assertIn(cookie_name, resp.cookies)
        self.assertEqual(resp.cookies[cookie_name].value, resp.json()["join_token"])

    def test_submit_quiz_answers_allows_completed_session(self):
        session = LiveSession.objects.create(
            quiz=self.quiz,
            status=LiveSession.Status.COMPLETED,
            total_time_limit=300,
        )
        p = Participant.objects.create(live_session=session, display_name="LateSubmitter")
        resp = self.client.post(
            reverse("api_submit_quiz_answers", args=[session.game_pin]),
            {"answers": {str(self.q1.id): "a"}},
            content_type="application/json",
            HTTP_X_PARTICIPANT_TOKEN=p.join_token,
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["accepted"])
        p.refresh_from_db()
        self.assertIsNotNone(p.submitted_at)


# ──────────────────────────────────────────────────────────────────────────────
# Google Host Authentication & Per-User Quiz Ownership Suite
# ──────────────────────────────────────────────────────────────────────────────

class GoogleHostAuthAndQuizOwnershipTests(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            username="usera@google.com",
            email="usera@google.com",
            first_name="User Alpha",
        )
        HostProfile.objects.create(
            user=self.user_a,
            google_id="google-sub-user-a",
            avatar_url="https://lh3.googleusercontent.com/a/usera-avatar.png",
        )

        self.user_b = User.objects.create_user(
            username="userb@google.com",
            email="userb@google.com",
            first_name="User Beta",
        )
        HostProfile.objects.create(
            user=self.user_b,
            google_id="google-sub-user-b",
            avatar_url="https://lh3.googleusercontent.com/a/userb-avatar.png",
        )

        self.quiz_a = Quiz.objects.create(
            title="User A Private Quiz",
            description="Alpha only",
            category="Security",
            difficulty="hard",
            time_limit=240,
            author=self.user_a,
        )
        self.q_a = _make_question(self.quiz_a, "Alpha Question", correct="a")

        self.client_a = Client()
        self.client_a.force_login(self.user_a)

        self.client_b = Client()
        self.client_b.force_login(self.user_b)

        self.anon_client = Client()

    def test_unauthenticated_host_access_is_blocked(self):
        # HTML routes redirect to login
        resp_list = self.anon_client.get(reverse("host_quiz_list"))
        self.assertRedirects(resp_list, reverse("auth_login_view"))

        resp_create = self.anon_client.get(reverse("create_quiz"))
        self.assertRedirects(resp_create, reverse("auth_login_view"))

        # REST API routes return 401
        resp_api_list = self.anon_client.get(reverse("api_host_quizzes"))
        self.assertEqual(resp_api_list.status_code, 401)

        resp_api_create = self.anon_client.post(
            reverse("api_create_quiz"),
            {"title": "Anon Quiz"},
            content_type="application/json",
        )
        self.assertEqual(resp_api_create.status_code, 401)

    def test_google_host_login_and_persistent_identity(self):
        from .oauth import get_or_create_google_host_user

        userinfo = {
            "sub": "google-sub-12345",
            "email": "teacher.new@google.com",
            "name": "Teacher New",
            "picture": "https://lh3.googleusercontent.com/a/teacher.png",
        }
        # First login -> creates user
        user1 = get_or_create_google_host_user(userinfo)
        self.assertEqual(user1.email, "teacher.new@google.com")
        self.assertEqual(user1.first_name, "Teacher New")
        self.assertEqual(user1.host_profile.google_id, "google-sub-12345")
        self.assertEqual(user1.host_profile.avatar_url, "https://lh3.googleusercontent.com/a/teacher.png")

        # Second login with same Google identity -> resolves same user instance
        user2 = get_or_create_google_host_user(userinfo)
        self.assertEqual(user1.id, user2.id)

    def test_user_a_sees_own_quizzes(self):
        resp = self.client_a.get(reverse("api_host_quizzes"))
        self.assertEqual(resp.status_code, 200)
        quizzes = resp.json()["quizzes"]
        self.assertEqual(len(quizzes), 1)
        self.assertEqual(quizzes[0]["id"], self.quiz_a.id)
        self.assertEqual(quizzes[0]["title"], "User A Private Quiz")

    def test_user_b_cannot_see_user_a_quizzes(self):
        resp = self.client_b.get(reverse("api_host_quizzes"))
        self.assertEqual(resp.status_code, 200)
        quizzes = resp.json()["quizzes"]
        # User B has no quizzes yet
        self.assertEqual(len(quizzes), 0)

    def test_user_b_cannot_access_or_edit_user_a_quiz(self):
        # Detail view
        resp_detail = self.client_b.get(reverse("api_quiz_detail", args=[self.quiz_a.id]))
        self.assertEqual(resp_detail.status_code, 404)

        # Add question
        resp_add = self.client_b.post(
            reverse("api_add_question", args=[self.quiz_a.id]),
            {
                "question_text": "Hacked question",
                "option_a": "1",
                "option_b": "2",
                "option_c": "3",
                "option_d": "4",
                "correct_answer": "a",
            },
            content_type="application/json",
        )
        self.assertEqual(resp_add.status_code, 404)

        # Delete question
        resp_del_q = self.client_b.post(
            reverse("api_delete_question", args=[self.quiz_a.id, self.q_a.id]),
        )
        self.assertEqual(resp_del_q.status_code, 404)

        # Delete quiz
        resp_del = self.client_b.post(reverse("api_delete_quiz", args=[self.quiz_a.id]))
        self.assertEqual(resp_del.status_code, 404)

        # Export quiz
        resp_export = self.client_b.get(reverse("api_export_quiz", args=[self.quiz_a.id]))
        self.assertEqual(resp_export.status_code, 404)

        # Launch live session
        resp_launch = self.client_b.post(reverse("api_create_live_session", args=[self.quiz_a.id]))
        self.assertEqual(resp_launch.status_code, 404)

    def test_user_b_can_create_and_manage_own_quiz(self):
        resp_create = self.client_b.post(
            reverse("api_create_quiz"),
            {
                "title": "User B Quiz",
                "description": "Beta quiz",
                "category": "Math",
                "difficulty": "easy",
                "time_limit": 300,
            },
            content_type="application/json",
        )
        self.assertEqual(resp_create.status_code, 201)
        quiz_b_id = resp_create.json()["id"]

        quiz_b = Quiz.objects.get(id=quiz_b_id)
        self.assertEqual(quiz_b.author, self.user_b)

        # User B sees Quiz B in their dashboard
        resp_list = self.client_b.get(reverse("api_host_quizzes"))
        self.assertEqual(len(resp_list.json()["quizzes"]), 1)
        self.assertEqual(resp_list.json()["quizzes"][0]["id"], quiz_b_id)

        # User A cannot see Quiz B
        resp_list_a = self.client_a.get(reverse("api_host_quizzes"))
        self.assertEqual(len(resp_list_a.json()["quizzes"]), 1)
        self.assertEqual(resp_list_a.json()["quizzes"][0]["id"], self.quiz_a.id)

    def test_api_auth_me_endpoint(self):
        # Authenticated user A
        resp_a = self.client_a.get(reverse("api_auth_me"))
        self.assertEqual(resp_a.status_code, 200)
        data_a = resp_a.json()
        self.assertTrue(data_a["is_authenticated"])
        self.assertEqual(data_a["user"]["name"], "User Alpha")
        self.assertEqual(data_a["user"]["email"], "usera@google.com")
        self.assertEqual(data_a["user"]["avatar_url"], "https://lh3.googleusercontent.com/a/usera-avatar.png")

        # Unauthenticated client
        resp_anon = self.anon_client.get(reverse("api_auth_me"))
        self.assertEqual(resp_anon.status_code, 200)
        self.assertFalse(resp_anon.json()["is_authenticated"])

    def test_logout_flow_clears_host_session(self):
        resp_logout = self.client_a.get(reverse("auth_logout_view"))
        self.assertRedirects(resp_logout, reverse("home"))

        # Subsequent host request redirected to login
        resp_check = self.client_a.get(reverse("host_quiz_list"))
        self.assertRedirects(resp_check, reverse("auth_login_view"))

    def test_participant_gameplay_requires_no_authentication(self):
        # User A hosts a live session
        resp_sess = self.client_a.post(reverse("api_create_live_session", args=[self.quiz_a.id]))
        self.assertEqual(resp_sess.status_code, 201)
        pin = resp_sess.json()["game_pin"]

        # Guest participant joins without account
        guest = Client()
        join_resp = guest.post(
            reverse("api_join_game"),
            {"game_pin": pin, "display_name": "GuestGamer"},
            content_type="application/json",
        )
        self.assertEqual(join_resp.status_code, 201)
        token = join_resp.json()["join_token"]

        # Host starts quiz
        start_resp = self.client_a.post(reverse("api_host_start_quiz", args=[pin]))
        self.assertEqual(start_resp.status_code, 200)

        # Guest answers question
        ans_resp = guest.post(
            reverse("api_submit_quiz_answers", args=[pin]),
            {"answers": {str(self.q_a.id): "a"}},
            content_type="application/json",
            HTTP_X_PARTICIPANT_TOKEN=token,
        )
        self.assertEqual(ans_resp.status_code, 200)
        self.assertTrue(ans_resp.json()["accepted"])

        # Host ends quiz
        end_resp = self.client_a.post(reverse("api_host_end_quiz", args=[pin]))
        self.assertEqual(end_resp.status_code, 200)

        # Guest views results
        res_resp = guest.get(reverse("api_participant_result", args=[pin]), HTTP_X_PARTICIPANT_TOKEN=token)
        self.assertEqual(res_resp.status_code, 200)
        self.assertEqual(res_resp.json()["score"], 1000)
        self.assertEqual(res_resp.json()["rank"], 1)





