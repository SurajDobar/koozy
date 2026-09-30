# 🚀 Koozy — Real-Time AI Multiplayer Quiz Platform

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Django-6.x-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Channels](https://img.shields.io/badge/Django_Channels-4.x-FF6600?logo=django&logoColor=white)](https://channels.readthedocs.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini-AI_3.6-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-black?logo=socketdotio&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Watch the live demo on YouTube 👇**
>
> [![Koozy Demo](https://img.youtube.com/vi/vlDssxNcjaU/maxresdefault.jpg)](https://youtu.be/vlDssxNcjaU)

---

## 📖 Overview

**Koozy** is an interactive, real-time multiplayer quiz and trivia platform designed for classrooms, live events, meetups, and parties.

Hosts can easily create custom quizzes, instantly generate full quizzes with **Google Gemini AI**, and launch live game sessions with a 6-digit Game PIN. Participants join instantly from any device (smartphones, tablets, laptops) via their browser with **zero app installation or account required**.

---

## ✨ Key Features

- 🎯 **Host Authoring Studio**: Create, edit, reorder, and manage quizzes with customizable time limits, point weights, and instant answer feedback.
- 🤖 **AI-Powered Quiz Generator**: Generate full multiple-choice trivia quizzes on any topic in seconds using the Google Gemini API.
- ⚡ **Real-Time Multiplayer Gameplay**: Powered by Django Channels and WebSockets for low-latency live lobby sync, timer countdowns, and question delivery.
- 📱 **Cross-Device Ready**: Host from a laptop or display on a projector/TV while players participate using their mobile phones over local Wi-Fi or the internet.
- 🔢 **Frictionless PIN-Based Join**: Guests join in seconds using a 6-digit game PIN and nickname.
- 🏆 **Live Leaderboards & Podium**: Real-time score tracking, speed-based bonuses, and an animated victory podium for top 3 finishers.
- 🔐 **Host Authentication**: Secure Google OAuth 2.0 single sign-on with persistent host sessions and profile avatars.
- 📦 **JSON Import & Export**: Back up, share, and import quizzes effortlessly.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons |
| **Backend** | Django 6.x, Django REST Framework, Django Channels (ASGI/Daphne) |
| **Real-Time** | WebSockets (In-Memory Channel Layer) |
| **AI Integration** | Google Gemini API (`gemini-3.6-flash`) |
| **Authentication** | Google OAuth 2.0 (Host), Anonymous Session Tokens (Participants) |
| **Database** | SQLite (Development / Testing) / PostgreSQL-ready |

---

## 📁 Project Structure

```text
koozy/
├── backend/                               # Django ASGI / Channels Backend
│   ├── config/                            # Project settings & ASGI/WSGI config
│   │   ├── asgi.py                        # ASGI protocol routing (HTTP & WebSockets)
│   │   ├── settings.py                    # Django configuration & Channels setup
│   │   ├── urls.py                        # Root URL routing
│   │   └── wsgi.py                        # WSGI entry point
│   ├── quiz/                              # Core Quiz application
│   │   ├── ai_service.py                  # Gemini AI quiz generation & prompt engine
│   │   ├── api.py                         # REST API endpoints (quizzes, sessions, gameplay)
│   │   ├── consumers.py                   # WebSocket consumers (live lobby & game state)
│   │   ├── forms.py                       # Django forms & validation
│   │   ├── models.py                      # Data models (Quiz, Question, LiveSession, etc.)
│   │   ├── oauth.py                       # Google OAuth 2.0 integration
│   │   ├── realtime.py                    # Channel layer broadcast helpers
│   │   ├── routing.py                     # WebSocket URL routing patterns
│   │   ├── static/quiz/dist/              # Built frontend static assets (CSS/JS bundle)
│   │   ├── templates/quiz/                # Django HTML templates (app.html SPA shell)
│   │   ├── tests.py                       # Unit and integration test suites
│   │   ├── urls.py                        # Quiz app route definitions
│   │   └── views.py                       # Django views & SPA entrypoints
│   ├── manage.py                          # Django CLI utility
│   ├── requirements.txt                   # Python dependencies
│   ├── .env.example                       # Backend environment template
│   └── .env                               # Local backend environment variables (git-ignored)
│
├── frontend/                              # React 19 + Vite Single Page App
│   ├── public/                            # Static public assets
│   ├── src/
│   │   ├── assets/                        # Images, sounds, and media
│   │   ├── components/                    # Reusable React components
│   │   │   ├── AIGeneratorModal.jsx       # Gemini AI modal generator
│   │   │   ├── HostLiveDashboard.jsx      # Host live game control dashboard
│   │   │   ├── HostLobby.jsx              # Host live waiting room
│   │   │   ├── HostResults.jsx            # Host final leaderboard & summary
│   │   │   ├── Navbar.jsx                 # Header navigation & user badge
│   │   │   ├── ParticipantLobby.jsx       # Participant waiting screen
│   │   │   ├── ParticipantQuiz.jsx        # Participant question & answer interface
│   │   │   ├── ParticipantResults.jsx     # Participant scorecard & rank
│   │   │   ├── ParticipantSubmittedWaiting.jsx # Answer received state
│   │   │   └── UserProfileBadge.jsx       # Google account avatar & details
│   │   ├── pages/                         # Main route views
│   │   │   ├── HomePage.jsx               # Landing page & quick join
│   │   │   ├── HostAddQuestionsPage.jsx   # Question editor & reordering
│   │   │   ├── HostCreateQuizPage.jsx     # Quiz creation form
│   │   │   ├── HostQuizListPage.jsx       # Host quiz management library
│   │   │   ├── JoinPage.jsx               # Participant PIN entry page
│   │   │   └── LoginPage.jsx              # Host Google login page
│   │   ├── utils/                         # Helper utilities
│   │   │   └── websocket.js               # Dynamic WebSocket client connector
│   │   ├── App.jsx                        # Root React component & state router
│   │   ├── index.css                      # Global styles & Tailwind CSS v4 imports
│   │   └── main.jsx                       # React DOM root render
│   ├── package.json                       # Node dependencies & scripts
│   └── vite.config.js                     # Vite build configuration & bundle target
│
├── .gitignore
└── README.md                              # Project documentation
```

---

## ⚙️ Prerequisites

Make sure you have the following installed on your machine:
- **Python 3.10+** (Python 3.11 or 3.12 recommended)
- **Node.js 18+** & **npm**
- **Git**

---

## 🚀 Installation & Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/SurajDobar/koozy.git
cd koozy
```

---

### 2. Backend Setup (Django & Channels)

1. **Create and activate a virtual environment:**
   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Configure Environment Variables:**
   Create your `backend/.env` file from the provided template:
   ```bash
   # Windows (PowerShell):
   Copy-Item backend\.env.example backend\.env

   # macOS / Linux:
   cp backend/.env.example backend/.env
   ```

   Open `backend/.env` and update the values:
   ```env
   DJANGO_SECRET_KEY=your-secure-random-secret-key
   DEBUG=True
   ALLOWED_HOSTS=*

   # Google OAuth (Required for Host Google Login)
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   # Optional: defaults to request host + /auth/google/callback/
   # GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback/

   # Gemini AI Quiz Generator (Required for AI Quiz Generation)
   GEMINI_API_KEY=your-google-gemini-api-key
   GEMINI_MODEL=gemini-3.6-flash
   ```

4. **Apply Database Migrations:**
   ```bash
   python backend/manage.py migrate
   ```

5. **(Optional) Create a Django Superuser:**
   ```bash
   python backend/manage.py createsuperuser
   ```

---

### 3. Frontend Setup (React & Vite)

1. **Navigate to the `frontend` folder and install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Build the production bundle for Django:**
   ```bash
   npm run build
   ```
   > 💡 This compiles the React application and outputs the bundled CSS and JS directly into Django's static directory (`backend/quiz/static/quiz/dist/`).

3. **(Alternative) Running Vite in standalone Dev Mode:**
   ```bash
   npm run dev
   ```

---

### 4. Start the Application Server

From the project root (with your virtual environment active):

```bash
# Start Django with Channels / Daphne support:
python backend/manage.py runserver
```

Open your browser and visit: **`http://localhost:8000`** (or **`http://127.0.0.1:8000`**).

---

## 📱 Playing Across Devices (Smartphones, Tablets & LAN)

Koozy is built for multi-device trivia sessions. You can run the server on your computer and have participants join on their smartphones or tablets over the same Wi-Fi network.

```
┌────────────────────────────────────────────────────────┐
│                      Host Laptop                       │
│  • Runs Django Server on 0.0.0.0:8000                  │
│  • Displays Lobby & Live Leaderboard on TV/Projector   │
└──────────────────────────┬─────────────────────────────┘
                           │
             Local Wi-Fi Network / Hotspot
                           │
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                    ▼
┌───────────┐        ┌───────────┐        ┌───────────┐
│ Player 1  │        │ Player 2  │        │ Player N  │
│  (Phone)  │        │ (Tablet)  │        │  (Phone)  │
│ PIN:123456│        │ PIN:123456│        │ PIN:123456│
└───────────┘        └───────────┘        └───────────┘
```

### Step 1: Find Your Host Computer's Local IP Address

- **Windows**: Open PowerShell/CMD and run:
  ```powershell
  ipconfig
  ```
  Look for `IPv4 Address` under your active Wi-Fi or Ethernet adapter (e.g., `192.168.1.45`).

- **macOS**:
  ```bash
  ipconfig getifaddr en0
  ```

- **Linux**:
  ```bash
  hostname -I
  ```

### Step 2: Start the Django Server Bound to All Interfaces

Run the server with `0.0.0.0:8000`:

```bash
python backend/manage.py runserver 0.0.0.0:8000
```

> **Note:** `ALLOWED_HOSTS=*` in `backend/.env` allows connections from any local IP.

### Step 3: Connect Players from Their Devices

1. Ensure all devices (phones, tablets, laptops) are connected to the **same Wi-Fi network** or mobile hotspot as the host computer.
2. Open any browser (Chrome, Safari, Firefox) on the mobile device.
3. Navigate to:
   ```
   http://<YOUR_HOST_LOCAL_IP>:8000
   ```
   *(Example: `http://192.168.1.45:8000`)*
4. Enter the **6-digit Game PIN** shown on the host screen, pick a nickname, and start playing!

> 💡 **Tip:** If mobile devices cannot connect, check your host computer's firewall settings to ensure incoming connections on port `8000` are permitted.

---

## 🔑 Environment Variables Reference

| Variable | Description | Required | Default |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | Secret key for Django cryptographic signing | Yes | Random dev key |
| `DEBUG` | Enables Django debug mode | No | `True` |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hostnames/IPs | No | `*` |
| `GEMINI_API_KEY` | API Key from [Google AI Studio](https://aistudio.google.com/) for AI quiz generation | Optional | `""` |
| `GEMINI_MODEL` | Gemini model version | No | `gemini-3.6-flash` |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console | Optional | `""` |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret from Google Cloud Console | Optional | `""` |
| `GOOGLE_REDIRECT_URI` | Custom OAuth callback URL override | Optional | Automatically inferred |

---

## 🧪 Running Tests

Run the complete backend test suite:

```bash
python backend/manage.py test quiz
```



---


<p align="center">Made with ❤️ using Django, React & Google Gemini</p>
