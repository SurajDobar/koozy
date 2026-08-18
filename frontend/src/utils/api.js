/**
 * API client for Koozy React frontend.
 * Strictly uses tab-scoped sessionStorage participant tokens and X-Participant-Token header.
 */

const TOKEN_KEY = 'koozy_participant_token';

export function getParticipantToken(pin) {
  if (pin) {
    const pinToken = sessionStorage.getItem(`${TOKEN_KEY}_${pin}`);
    if (pinToken) return pinToken;
  }
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export function setParticipantToken(token, pin) {
  if (!token) return;
  sessionStorage.setItem(TOKEN_KEY, token);
  if (pin) {
    sessionStorage.setItem(`${TOKEN_KEY}_${pin}`, token);
  }
}

export function getHeaders(pin, extra = {}) {
  const token = getParticipantToken(pin);
  const headers = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (token) {
    headers['X-Participant-Token'] = token;
  }
  // Include CSRF token if present
  const csrfCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='));
  if (csrfCookie) {
    headers['X-CSRFToken'] = csrfCookie.split('=')[1];
  } else if (window.__KOOZY_CONFIG__?.csrfToken) {
    headers['X-CSRFToken'] = window.__KOOZY_CONFIG__.csrfToken;
  }
  return headers;
}

export async function fetchSessionState(pin) {
  const res = await fetch(`/api/sessions/${pin}/state/`, {
    headers: getHeaders(pin),
  });
  if (!res.ok) throw new Error(`Failed to fetch session state: ${res.status}`);
  return res.json();
}

export async function submitQuizAnswers(pin, answers) {
  const res = await fetch(`/api/sessions/${pin}/submit/`, {
    method: 'POST',
    headers: getHeaders(pin),
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to submit answers');
  }
  return res.json();
}

export async function startQuiz(pin, totalTimeLimit) {
  const body = totalTimeLimit && Number(totalTimeLimit) > 0 ? { total_time_limit: Number(totalTimeLimit) } : {};
  const res = await fetch(`/api/sessions/${pin}/start/`, {
    method: 'POST',
    headers: getHeaders(pin),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to start quiz');
  return res.json();
}

export async function endQuiz(pin) {
  const res = await fetch(`/api/sessions/${pin}/end/`, {
    method: 'POST',
    headers: getHeaders(pin),
  });
  if (!res.ok) throw new Error('Failed to end quiz');
  return res.json();
}

export async function kickParticipant(pin, participantId) {
  const res = await fetch(`/api/sessions/${pin}/kick/`, {
    method: 'POST',
    headers: getHeaders(pin),
    body: JSON.stringify({ participant_id: participantId }),
  });
  if (!res.ok) throw new Error('Failed to kick participant');
  return res.json();
}

export async function fetchParticipantResult(pin) {
  const res = await fetch(`/api/sessions/${pin}/result/`, {
    headers: getHeaders(pin),
  });
  if (!res.ok) throw new Error('Failed to fetch participant results');
  return res.json();
}

export async function fetchHostResult(pin) {
  const res = await fetch(`/api/sessions/${pin}/host-result/`, {
    headers: getHeaders(pin),
  });
  if (!res.ok) throw new Error('Failed to fetch host results');
  return res.json();
}

// ── Quiz Authoring & Library APIs ──────────────────────────────────────────

export async function fetchHostQuizzes() {
  const res = await fetch('/api/host/quizzes/', {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch host quizzes');
  return res.json();
}

export async function createQuiz(data) {
  const res = await fetch('/api/host/quizzes/create/', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create quiz');
  }
  return res.json();
}

export async function deleteQuiz(quizId) {
  const res = await fetch(`/api/host/quizzes/${quizId}/delete/`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete quiz');
  return res.json();
}

export async function fetchQuizDetail(quizId) {
  const res = await fetch(`/api/host/quizzes/${quizId}/`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch quiz details');
  return res.json();
}

export async function addQuestion(quizId, questionData) {
  const res = await fetch(`/api/host/quizzes/${quizId}/questions/add/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(questionData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to add question');
  }
  return res.json();
}

export async function deleteQuestion(quizId, questionId) {
  const res = await fetch(`/api/host/quizzes/${quizId}/questions/${questionId}/delete/`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete question');
  return res.json();
}

export async function createLiveSession(quizId) {
  const res = await fetch(`/api/host/quizzes/${quizId}/sessions/create/`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create live session');
  }
  return res.json();
}

export async function joinGame(gamePin, displayName) {
  const res = await fetch(`/api/join/`, {
    method: 'POST',
    headers: getHeaders(gamePin),
    body: JSON.stringify({ game_pin: gamePin, display_name: displayName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to join game');
  }
  return res.json();
}

export function clearParticipantToken(pin) {
  sessionStorage.removeItem(TOKEN_KEY);
  if (pin) {
    sessionStorage.removeItem(`${TOKEN_KEY}_${pin}`);
    sessionStorage.removeItem(`koozy_draft_${pin}`);
  }
}

export async function admitParticipant(pin, participantId) {
  const res = await fetch(`/api/sessions/${pin}/admit/`, {
    method: 'POST',
    headers: getHeaders(pin),
    body: JSON.stringify({ participant_id: participantId }),
  });
  if (!res.ok) throw new Error('Failed to admit participant');
  return res.json();
}

export async function exportQuiz(quizId) {
  const res = await fetch(`/api/host/quizzes/${quizId}/export/`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to export quiz');
  return res.json();
}

export async function importQuiz(quizData) {
  const res = await fetch('/api/host/quizzes/import/', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(quizData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to import quiz');
  }
  return res.json();
}

export async function reorderQuestions(quizId, questionIds) {
  const res = await fetch(`/api/host/quizzes/${quizId}/questions/reorder/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ question_ids: questionIds }),
  });
  if (!res.ok) throw new Error('Failed to reorder questions');
  return res.json();
}

