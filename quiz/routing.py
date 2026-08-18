from django.urls import path

from .consumers import LobbyConsumer


websocket_urlpatterns = [
    path("ws/live-sessions/<str:game_pin>/lobby/", LobbyConsumer.as_asgi()),
]
