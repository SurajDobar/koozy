# Koozy — Product Requirements Document

## 1. Overview

Koozy is a premium, Kahoot-style live quiz platform for hosts and participants.

Hosts create quizzes and run live quiz sessions. Participants join using a game PIN, participate in a timed quiz, and receive their results after the quiz ends.

Core flow:

Host starts → Participants join → Quiz starts → Participants answer → Quiz ends → Results

---

## 2. Users

### Host

- Must authenticate with Google
- Create and manage quizzes
- Host quiz sessions
- Wait for participants in a lobby
- Start the quiz
- View final results/leaderboard

### Participant

- Can continue as a guest
- Can optionally sign in with Google
- Join using a game PIN
- Choose a display name
- Participate in live quizzes
- View score and correct answers after completion

---

## 3. Host Flow

Google Login
→ Host Dashboard
→ Create/Select Quiz
→ Host Quiz
→ Game PIN Generated
→ Participant Lobby
→ Start Quiz
→ Live Quiz
→ Results

---

## 4. Participant Flow

Join Quiz
→ Enter Game PIN
→ Guest or Google Login
→ Enter Display Name
→ Lobby
→ Host Starts
→ Answer Questions
→ Timer Ends
→ Results

Guest participants must have a unique display name within a session.

### Participant Identity, Uniqueness & Reconnection Architecture

- **Scoped Display Name Uniqueness (Non-Global)**:
  - Display names are unique **only per live session** (`unique_participant_name_per_session`).
  - Two participants in different sessions/quizzes can have the same display name without conflict.
- **Authoritative Identity by Token Only**:
  - Participants are **NEVER** identified or reused by `display_name` alone.
  - Participant identity is strictly determined by unique `join_token`.
- **Duplicate Name & Reconnection Handling (`/api/join/` and `ParticipantJoinForm`)**:
  - **Same Name + Valid Existing Participant Token**:
    The request is treated as a reconnecting participant (e.g., page refresh or reconnection). The existing participant record is returned and reconnected.
  - **Same Name + No Valid Participant Token**:
    The request is rejected with `{"detail": "Name already in use"}` (HTTP 400). A newcomer cannot hijack an existing player's session or adopt another player's state.
  - **Renaming Protection**:
    A participant holding a valid token cannot change their nickname to a display name already in use by another participant in that session.
  - **Kicked State & Multi-Tab Isolation**:
    - If a participant or nickname was kicked by the host, re-entry with that kicked token or name is blocked with HTTP 403.
    - `POST /api/join/` must **NEVER** inspect ambient browser cookies (`request.COOKIES`) to authenticate or reconnect a participant. Cookies are shared across all tabs in a browser; reading them leaks participant identity across tabs (bypassing duplicate-name rejection) and causes kicked cookies to poison all subsequent joins in that browser.
    - Frontend `joinGame()` sends only clean join payloads without previous participant tokens from `sessionStorage`.
    - Stale or kicked participant tokens must never block other users or new joins under different nicknames.

---

## 5. Quiz

A quiz contains:

### Metadata
- Title
- Description
- Category
- Difficulty

### Questions
- Question text
- Option A
- Option B
- Option C
- Option D
- Correct answer

A quiz should be reusable across multiple sessions.

---

## 6. Live Session

A Quiz and a Session are separate entities.

Example:

Quiz:
Python Basics

Session:
Game PIN: 482719
Status: Waiting
Participants: 20

### Session states

WAITING → ACTIVE → COMPLETED

Participants joining the Game PIN appear in the host's lobby.

The host starts the quiz when ready.

WebSockets should be used for live lobby/session communication.

---

## 7. Quiz Rules

- The quiz has a time limit.
- Participants can submit answers during the active session.
- Correct answers must NOT be exposed to participants while the quiz is active.
- When the timer reaches zero, the quiz automatically ends.
- Correct answers become visible only after the quiz ends.
- Scores are calculated and stored.

---

## 8. Results

Participants see:

- Final score
- Correct answers count
- Wrong answers count
- Their answers
- Correct answers

Host sees:

- Participant results
- Scores
- Leaderboard

Example:

1. Suraj — 9/10
2. Rahul — 8/10
3. Aryan — 7/10

---

## 9. Authentication

### Host

Google authentication is required.

Host-owned quizzes and sessions must be associated with their account.

### Participant

Two options:

- Continue with Google
- Continue as Guest

Google-authenticated participants can later have persistent profiles and activity history.

---

## 10. Core Data

Conceptually:

User
→ Quiz
→ Questions
→ Session
→ Participants
→ Answers
→ Results

The exact Django models should be designed during implementation.

---

## 11. Import / Export

Future/high-priority feature.

Koozy should support exporting and importing quizzes using a structured format.

Possible format:

`.koozy`

Internally this can use JSON.

Structure:

Quiz Metadata
- Title
- Description
- Category
- Difficulty

Questions
- Question
- Options
- Correct Answer

---

## 12. AI Quiz Creation

Provide a `quizmaker.md` file that hosts can give to their preferred AI chatbot.

The AI should generate quiz data in Koozy's expected structure so it can be imported into Koozy.

Koozy does NOT need its own AI API for the MVP.

---

## 13. UI / Design

The UI must feel like a real premium product rather than a generic hobby project.

Design inspiration:

- Vercel
- shadcn/ui
- Modern SaaS products

Priorities:

- Excellent typography
- Strong spacing
- Clear hierarchy
- Consistent components
- Premium cards
- Responsive design
- Subtle animations
- Polished loading/error/empty states
- Clean color system

Avoid unnecessary visual clutter.

---

## 14. MVP — Must Work

- Host Google authentication
- Create quiz
- Create questions
- Store quiz in database
- Host session
- Generate Game PIN
- Participant guest joining
- Participant Google joining
- Lobby
- WebSocket communication
- Live quiz
- Timer
- Answer submission
- Quiz completion
- Score calculation
- Leaderboard
- Correct answer reveal after completion
- Premium UI

---

## 15. Future Updates

- Quiz import/export
- `.koozy` file format
- `quizmaker.md`
- Host quiz/session history
- Excel/CSV result export
- Participant profiles
- Participant quiz history
- Advanced analytics
- End Quiz button
- XP and achievements
- Global rankings
- AI API integration

These features must not block the MVP.

---

## 16. Development Priority

Build in this order:

1. Authentication
2. Quiz creation
3. Quiz/question database
4. Quiz hosting
5. Participant joining
6. Live lobby
7. WebSocket quiz
8. Timer and answers
9. Results/leaderboard
10. Premium UI polish
11. Future features only if MVP is stable

Primary goal:

**Build a complete, working Koozy MVP first. Then improve its design and add extensions if time allows.**
