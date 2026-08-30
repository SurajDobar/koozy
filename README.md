# Koozy

[![React](https://img.shields.io/badge/React-2026-blue?logo=react&logoColor=white)](https://react.dev/)
[![Django](https://img.shields.io/badge/Django-6.x-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Realtime-black?logo=socketdotio&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)


<video src="public/Koozy.mp4" controls autoplay width="100%"></video>

---

## What is Koozy?

Koozy is a real-time multiplayer quiz platform where hosts can create quizzes, generate them with AI, and run live game sessions while participants join instantly using a PIN — no account required.

## ✨ Features

- 🎯 Create and manage quizzes
- 🤖 AI-powered quiz generation with Gemini
- ⚡ Real-time multiplayer gameplay
- 🔢 PIN-based guest joining
- 🏆 Live scoring & leaderboard
- 🔐 Google authentication for Hosts
- 📥 JSON import & export
- 📡 WebSocket-powered live sessions

## 🛠️ Built With

**React · Vite · Django · Django Channels · SQLite · Google OAuth · Gemini API**



<!-- Add your demo GIF/video here -->

---

## 🚀 Run Locally

```bash
git clone <your-repository-url>
cd koozy

python -m venv venv
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

Then run the frontend:

cd frontend
npm install
npm run dev


```
Create a .env file with your Google OAuth and Gemini API credentials.
for more information read the .env.example
<p align="center"> Built with Django, React & way too much caffeine. </p> 

