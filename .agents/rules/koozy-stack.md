# Koozy Full-Stack Engineering Standards

---

## 1. Backend Standards (Django, DRF, Channels)

### Django & REST Framework:
- **Models & DB**:
  - Keep models clean with explicit field constraints, indexes on frequently queried fields (e.g. `game_pin`, `session_id`), and proper `related_name` values.
  - Run `python manage.py makemigrations` and `python manage.py migrate` whenever model definitions change.
- **REST APIs**:
  - Use Django REST Framework serializers with validation methods (`validate_<field>`, `validate()`).
  - Standardize API error responses with clear `detail` or error objects and appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500).
- **Service Layer**:
  - Extract complex business logic (e.g. quiz state transitions, leaderboard calculations, scoring algorithms) into dedicated service helper modules within `quiz/services/` or `quiz/utils.py` rather than overloading views or consumers.

### Real-Time & WebSockets (Django Channels / Daphne):
- **Consumers**:
  - Use `AsyncJsonWebsocketConsumer` for structured, JSON-based real-time communication.
  - Handle client connection, room join/leave (`channel_layer.group_add`, `channel_layer.group_discard`), and error disconnections gracefully.
  - Authenticate or validate session/PIN during handshake or first message.
  - Guard against duplicate answers, late submissions (post-timer), or invalid action payloads.

---

## 2. Frontend Standards (React 19, Vite, Tailwind CSS v4)

### Component Architecture:
- **Functional Components & Hooks**:
  - Build clean, functional components with typed props / JSDoc where applicable.
  - Extract WebSocket connection logic, timer tickers, and room state into custom hooks (e.g. `useQuizSocket`, `useTimer`, `useGameState`).
- **State Management**:
  - Maintain atomic, predictable state for live quiz stages: `LOBBY` ➡️ `QUESTION_ACTIVE` ➡️ `QUESTION_REVEAL` ➡️ `LEADERBOARD` ➡️ `FINAL_RESULTS`.
  - Handle reconnection states, network drops, and reconnect indicators smoothly.

### UI & Styling:
- **Tailwind CSS v4 & Lucide Icons**:
  - Follow modern UI aesthetics: clean dark/light contrast, glassmorphism cards, vibrant accents, smooth transitions, and distinct option card colors for quiz answering.
  - Keep UI fully responsive for both mobile participants and desktop hosts.
