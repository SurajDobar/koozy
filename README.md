# Koozy 🎯

Koozy is a real-time multiplayer quiz platform built with Django and React.

It lets a host create quizzes, start a live session, share a Game PIN, and have multiple players join and play together in real time.

## Features

- Create and manage quizzes
- Multiple-choice questions with customizable correct answers
- Live multiplayer quiz sessions
- Game PIN based joining
- Real-time participant updates
- Synchronized quiz timer
- Question navigation
- Automatic answer submission
- Live host controls
- Player results and leaderboard
- Quiz import/export using JSON
- Responsive React interface

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS

**Backend**
- Django
- Django REST Framework
- Django Channels
- WebSockets

**Database**
- SQLite

## Getting Started

### Requirements

- Python 3.x
- Node.js
- npm

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/koozy.git
cd koozy
````

### 2. Set up the backend

```bash
python -m venv venv
```

On Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run migrations:

```bash
python manage.py migrate
```

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Start the server

```bash
python manage.py runserver
```

Open:

```text
http://127.0.0.1:8000/
```

## Testing

Run the Django test suite:

```bash
python manage.py test
```

Build the React frontend:

```bash
cd frontend
npm run build
```

## Project Structure

```text
koozy/
├── config/          # Django configuration
├── quiz/            # Django application
├── frontend/        # React + Vite frontend
├── documents/       # Project documentation
├── manage.py
├── requirements.txt
└── .gitignore
```

## License

This project is currently developed as a personal project.
