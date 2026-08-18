"""
Koozy real-time event helpers.

Every function here is safe to call from a synchronous Django view.
They bridge into the async channel layer via async_to_sync.
"""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.utils import timezone

from .models import LiveSession, Participant


# ── Group naming ────────────────────────────────────────────────────────────

def lobby_group_name(live_session_id):
    return f"live_session_{live_session_id}"


# ── Payload builders ────────────────────────────────────────────────────────

def lobby_state(live_session):
    admitted = list(
        live_session.participants.filter(is_kicked=False, is_admitted=True).values(
            "id", "display_name", "submitted_at"
        )
    )
    for p in admitted:
        p["has_submitted"] = bool(p.get("submitted_at"))

    pending = list(
        live_session.participants.filter(is_kicked=False, is_admitted=False).values(
            "id", "display_name"
        )
    )

    return {
        "type": "lobby_state",
        "status": live_session.status,
        "participant_count": len(admitted),
        "participants": admitted,
        "pending_count": len(pending),
        "pending_participants": pending,
        "submissions_count": sum(1 for p in admitted if p["has_submitted"]),
        "seconds_remaining": live_session.seconds_remaining(),
        "total_time_limit": live_session.total_time_limit,
    }


def _leaderboard_payload(live_session):
    participants = list(
        live_session.participants.filter(is_kicked=False, is_admitted=True)
        .order_by("-score", "joined_at")
        .values("id", "display_name", "score", "submitted_at")
    )
    for rank, p in enumerate(participants, start=1):
        p["rank"] = rank
        p["has_submitted"] = bool(p.get("submitted_at"))
    return participants


# ── Broadcast functions (called from sync views/APIs) ─────────────────────────

def _send(live_session_id, message):
    channel_layer = get_channel_layer()
    if channel_layer is not None:
        async_to_sync(channel_layer.group_send)(
            lobby_group_name(live_session_id),
            message,
        )


def publish_lobby_state(live_session):
    _send(
        live_session.id,
        {"type": "lobby.state", "payload": lobby_state(live_session)},
    )


def publish_quiz_start(live_session):
    """Broadcast when the host starts the quiz."""
    _send(
        live_session.id,
        {
            "type": "quiz.start",
            "payload": {
                "event": "quiz_start",
                "status": live_session.status,
                "total_time_limit": live_session.total_time_limit,
                "seconds_remaining": live_session.seconds_remaining(),
                "quiz_started_at": live_session.quiz_started_at.isoformat() if live_session.quiz_started_at else None,
            },
        },
    )


def publish_participant_kicked(live_session, participant_id):
    """Broadcast when a participant is removed by host."""
    _send(
        live_session.id,
        {
            "type": "participant.kicked",
            "payload": {
                "event": "participant_kicked",
                "participant_id": participant_id,
            },
        },
    )
    publish_lobby_state(live_session)


def publish_participant_admitted(live_session, participant_id):
    """Broadcast when a pending participant is admitted by host."""
    _send(
        live_session.id,
        {
            "type": "participant.admitted",
            "payload": {
                "event": "participant_admitted",
                "participant_id": participant_id,
            },
        },
    )
    publish_lobby_state(live_session)


def publish_submission_update(live_session):
    """Broadcast when a participant submits their quiz answers."""
    _send(
        live_session.id,
        {
            "type": "submission.update",
            "payload": {
                "event": "submission_update",
                "submissions_count": live_session.participants.filter(
                    is_kicked=False, submitted_at__isnull=False
                ).count(),
                "participant_count": live_session.participants.filter(is_kicked=False).count(),
            },
        },
    )


def publish_quiz_complete(live_session):
    """Broadcast when the quiz is completed."""
    _send(
        live_session.id,
        {
            "type": "quiz.complete",
            "payload": {
                "event": "quiz_complete",
                "leaderboard": _leaderboard_payload(live_session),
            },
        },
    )


def maybe_complete_quiz(live_session):
    """
    Complete the entire quiz if time expired.
    Uses select_for_update to prevent duplicate completions.
    """
    if live_session.status != LiveSession.Status.ACTIVE:
        return False

    if live_session.seconds_remaining() > 0:
        return False

    with transaction.atomic():
        locked = LiveSession.objects.select_for_update().get(pk=live_session.pk)
        if locked.status != LiveSession.Status.ACTIVE:
            return False
        locked.status = LiveSession.Status.COMPLETED
        locked.ended_at = timezone.now()
        locked.save(update_fields=["status", "ended_at"])

    live_session.status = LiveSession.Status.COMPLETED
    live_session.ended_at = locked.ended_at
    publish_quiz_complete(live_session)
    return True


# Backward compatibility aliases
def publish_question_start(live_session):
    publish_quiz_start(live_session)

def publish_answer_closed(live_session):
    _send(
        live_session.id,
        {
            "type": "quiz.answer_closed",
            "payload": {
                "event": "answer_closed",
                "question_index": live_session.current_question_index,
            },
        },
    )

def maybe_close_question(live_session):
    if live_session.status != LiveSession.Status.ACTIVE:
        return False

    if live_session.current_question_closed:
        return False

    q = live_session.current_question()
    time_limit = q.time_limit if q else live_session.total_time_limit
    if live_session.seconds_elapsed() < time_limit:
        return False

    with transaction.atomic():
        locked = LiveSession.objects.select_for_update().get(pk=live_session.pk)
        if locked.current_question_closed or locked.status != LiveSession.Status.ACTIVE:
            return False
        locked.current_question_closed = True
        locked.save(update_fields=["current_question_closed"])

    live_session.current_question_closed = True
    publish_answer_closed(live_session)
    return True

