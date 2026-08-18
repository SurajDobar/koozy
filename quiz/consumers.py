from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .models import LiveSession
from .realtime import lobby_group_name, lobby_state


class LobbyConsumer(AsyncJsonWebsocketConsumer):
    """
    Handles the WebSocket connection for all clients (host + participants).

    Channel group: live_session_<id>

    Inbound events from the channel layer
    ──────────────────────────────────────
    lobby.state        → lobby participant list / session status update
    quiz.question      → new question broadcast
    quiz.answer_closed → answer window closed; reveals correct answer + leaderboard
    quiz.leaderboard   → leaderboard update
    quiz.complete      → quiz finished
    """

    async def connect(self):
        game_pin = self.scope["url_route"]["kwargs"]["game_pin"]
        live_session = await self.get_live_session(game_pin)
        if live_session is None:
            await self.close(code=4404)
            return

        self.group_name = lobby_group_name(live_session.id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        # Send current state immediately on connect
        await self.send_json(await self.get_lobby_state(live_session.id))

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # ── Channel-layer event handlers ────────────────────────────────────

    async def lobby_state(self, event):
        await self.send_json(event["payload"])

    async def quiz_start(self, event):
        await self.send_json(event["payload"])

    async def quiz_question(self, event):
        await self.send_json(event["payload"])

    async def quiz_answer_closed(self, event):
        await self.send_json(event["payload"])

    async def quiz_leaderboard(self, event):
        await self.send_json(event["payload"])

    async def submission_update(self, event):
        await self.send_json(event["payload"])

    async def participant_kicked(self, event):
        await self.send_json(event["payload"])

    async def participant_admitted(self, event):
        await self.send_json(event["payload"])

    async def quiz_complete(self, event):
        await self.send_json(event["payload"])

    # ── DB helpers ───────────────────────────────────────────────────────

    @database_sync_to_async
    def get_live_session(self, game_pin):
        return LiveSession.objects.filter(game_pin=game_pin).first()

    @database_sync_to_async
    def get_lobby_state(self, live_session_id):
        return lobby_state(LiveSession.objects.get(id=live_session_id))
