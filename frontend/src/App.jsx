import React, { useState, useEffect } from 'react';
import HomePage from './views/HomePage';
import JoinPage from './views/JoinPage';
import LoginPage from './views/LoginPage';
import HostQuizListPage from './views/HostQuizListPage';
import HostCreateQuizPage from './views/HostCreateQuizPage';
import HostAddQuestionsPage from './views/HostAddQuestionsPage';
import LiveSessionController from './components/LiveSessionController';
import { setParticipantToken } from './utils/api';

export default function App() {
  const config = window.__KOOZY_CONFIG__ || {};
  const [currentRoute, setCurrentRoute] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }));

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute({
        pathname: window.location.pathname,
        search: window.location.search,
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const pathname = currentRoute.pathname;
  const queryParams = new URLSearchParams(currentRoute.search);

  // ── 1. Determine Page Route ──────────────────────────────────────────────
  let page = config.page || '';
  if (!page || (page === 'join' && pathname.includes('/lobby/'))) {
    if (pathname === '/' || pathname === '') {
      page = 'home';
    } else if (pathname.startsWith('/auth/login')) {
      page = 'login';
    } else if (pathname === '/join/' || pathname === '/join') {
      page = 'join';
    } else if (pathname.match(/^\/join\/[A-Za-z0-9]{5}\/?$/)) {
      page = 'join_pin';
    } else if (pathname.startsWith('/host/quizzes/create')) {
      page = 'create_quiz';
    } else if (pathname.match(/\/host\/quizzes\/\d+\/questions/)) {
      page = 'add_question';
    } else if (pathname.startsWith('/host/quizzes')) {
      page = 'host_quiz_list';
    } else if (pathname.startsWith('/host/sessions/')) {
      page = 'host_session';
    } else if (pathname.match(/\/join\/[A-Za-z0-9]{5}\/(lobby|play|result)/)) {
      page = 'participant_session';
    }
  }

  // ── 2. Live Session Properties ───────────────────────────────────────────
  const initialPin = (
    config.gamePin ||
    queryParams.get('pin') ||
    (pathname.match(/\/([A-Za-z0-9]{5})/i) || [])[1] ||
    ''
  ).toUpperCase();

  const isHost = Boolean(config.isHost || queryParams.get('role') === 'host' || page === 'host_session');

  // Token initialization
  const initialToken = config.participantToken || queryParams.get('pt');
  if (initialToken && initialPin) {
    setParticipantToken(initialToken, initialPin);
    const cleanUrl = new URL(window.location.href);
    if (cleanUrl.searchParams.has('pt')) {
      cleanUrl.searchParams.delete('pt');
      window.history.replaceState({}, '', cleanUrl.toString());
    }
  }

  // ── 3. Render Standalone Pages ───────────────────────────────────────────
  if (page === 'home') {
    return <HomePage user={config.user || null} />;
  }

  if (page === 'login') {
    return <LoginPage />;
  }

  if (page === 'join' || page === 'join_pin') {
    return (
      <JoinPage
        initialPin={initialPin}
        onJoinSuccess={(cleanPin, token) => {
          setParticipantToken(token, cleanPin);
          window.history.pushState({}, '', `/join/${cleanPin}/lobby/?pt=${token}`);
          setCurrentRoute({
            pathname: `/join/${cleanPin}/lobby/`,
            search: `?pt=${token}`,
          });
        }}
      />
    );
  }

  if (page === 'host_quiz_list') {
    return <HostQuizListPage initialQuizzes={config.quizzes || []} />;
  }

  if (page === 'create_quiz') {
    return <HostCreateQuizPage />;
  }

  if (page === 'add_question') {
    return <HostAddQuestionsPage quizId={config.quizId} initialQuiz={config.quiz} />;
  }

  // ── 4. Live Multiplayer Session Experience ───────────────────────────────
  return <LiveSessionController pin={initialPin} isHost={isHost} config={config} />;
}

