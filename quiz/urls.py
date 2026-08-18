from django.urls import path

from . import api, views

urlpatterns = [
    # ── Public / Home ──────────────────────────────────────────────────
    path("", views.home, name="home"),
    path("dev/", views.development_hub, name="development_hub"),

    # ── Teacher Authentication ─────────────────────────────────────────
    path("auth/login/", views.auth_login_view, name="auth_login_view"),
    path("auth/google/", views.auth_google_login, name="auth_google_login"),
    path("auth/logout/", views.auth_logout_view, name="auth_logout_view"),

    # ── Quiz browsing ──────────────────────────────────────────────────
    path("quizzes/", views.quiz_list, name="quiz_list"),

    # ── Host workspace ─────────────────────────────────────────────────
    path("host/quizzes/", views.host_quiz_list, name="host_quiz_list"),
    path("host/quizzes/create/", views.create_quiz, name="create_quiz"),
    path("host/quizzes/<int:quiz_id>/delete/", views.delete_quiz, name="delete_quiz"),
    path("host/quizzes/<int:quiz_id>/questions/add/", views.add_question, name="add_question"),
    path("host/quizzes/<int:quiz_id>/questions/<int:question_id>/delete/", views.delete_question, name="delete_question"),
    path("host/quizzes/<int:quiz_id>/sessions/create/", views.create_live_session, name="create_live_session"),

    # ── Host live session ──────────────────────────────────────────────
    path("host/sessions/<int:session_id>/", views.host_lobby, name="host_lobby"),
    path("host/sessions/<int:session_id>/start/", views.start_live_session, name="start_live_session"),
    path("host/sessions/<int:session_id>/next/", views.host_next_question, name="host_next_question"),
    path("host/sessions/<int:session_id>/close/", views.host_close_question, name="host_close_question"),
    path("host/sessions/<int:session_id>/result/", views.host_result_page, name="host_result_page"),

    # ── Participant join + game ────────────────────────────────────────
    path("join/", views.join_game, name="join_game"),
    path("join/<str:game_pin>/", views.participant_join, name="participant_join"),
    path("join/<str:game_pin>/lobby/", views.participant_lobby, name="participant_lobby"),
    path("join/<str:game_pin>/play/", views.participant_play, name="participant_play"),
    path("join/<str:game_pin>/result/", views.participant_result_page, name="participant_result_page"),

    # ── REST API ───────────────────────────────────────────────────────
    path("api/sessions/<str:game_pin>/state/", api.session_state, name="api_session_state"),
    path("api/sessions/<str:game_pin>/submit/", api.submit_quiz_answers, name="api_submit_quiz_answers"),
    path("api/sessions/<str:game_pin>/answer/", api.submit_answer, name="api_submit_answer"),
    path("api/sessions/<str:game_pin>/start/", api.host_start_quiz, name="api_host_start_quiz"),
    path("api/sessions/<str:game_pin>/end/", api.host_end_quiz, name="api_host_end_quiz"),
    path("api/sessions/<str:game_pin>/kick/", api.host_kick_participant, name="api_host_kick_participant"),
    path("api/sessions/<str:game_pin>/admit/", api.host_admit_participant, name="api_host_admit_participant"),
    path("api/sessions/<str:game_pin>/leaderboard/", api.leaderboard, name="api_leaderboard"),
    path("api/sessions/<str:game_pin>/result/", api.participant_result, name="api_participant_result"),
    path("api/sessions/<str:game_pin>/host-result/", api.host_result, name="api_host_result"),

    # ── Host Authoring & Library API ──────────────────────────────────
    path("api/host/quizzes/", api.api_host_quizzes, name="api_host_quizzes"),
    path("api/host/quizzes/create/", api.api_create_quiz, name="api_create_quiz"),
    path("api/host/quizzes/import/", api.api_import_quiz, name="api_import_quiz"),
    path("api/host/quizzes/<int:quiz_id>/export/", api.api_export_quiz, name="api_export_quiz"),
    path("api/host/quizzes/<int:quiz_id>/delete/", api.api_delete_quiz, name="api_delete_quiz"),
    path("api/host/quizzes/<int:quiz_id>/", api.api_quiz_detail, name="api_quiz_detail"),
    path("api/host/quizzes/<int:quiz_id>/questions/add/", api.api_add_question, name="api_add_question"),
    path("api/host/quizzes/<int:quiz_id>/questions/reorder/", api.api_reorder_questions, name="api_reorder_questions"),
    path("api/host/quizzes/<int:quiz_id>/questions/<int:question_id>/delete/", api.api_delete_question, name="api_delete_question"),
    path("api/host/quizzes/<int:quiz_id>/sessions/create/", api.api_create_live_session, name="api_create_live_session"),
    path("api/join/", api.api_join_game, name="api_join_game"),
]
