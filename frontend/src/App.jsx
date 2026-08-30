import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HostLobby from './components/HostLobby';
import HostLiveDashboard from './components/HostLiveDashboard';
import HostResults from './components/HostResults';
import ParticipantLobby from './components/ParticipantLobby';
import ParticipantQuiz from './components/ParticipantQuiz';
import ParticipantResults from './components/ParticipantResults';
import ParticipantSubmittedWaiting from './components/ParticipantSubmittedWaiting';
import HomePage from './pages/HomePage';
import JoinPage from './pages/JoinPage';
import LoginPage from './pages/LoginPage';
import HostQuizListPage from './pages/HostQuizListPage';
import HostCreateQuizPage from './pages/HostCreateQuizPage';
import HostAddQuestionsPage from './pages/HostAddQuestionsPage';

import { fetchSessionState, setParticipantToken, clearParticipantToken } from './utils/api';
import { createLobbySocket } from './utils/websocket';
import { AlertTriangle, UserX, HelpCircle, ArrowLeft } from 'lucide-react';

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

function LiveSessionController({ pin, isHost, config }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localSubmitted, setLocalSubmitted] = useState(false);
  const [hostSettling, setHostSettling] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const loadState = useCallback(async () => {
    if (!pin) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchSessionState(pin);
      setSession(data);
      setLoading(false);
      setIsReconnecting(false);
    } catch (err) {
      console.error(err);
      setError((prev) => (!prev ? 'Could not connect to live quiz session.' : prev));
      setLoading(false);
    }
  }, [pin]);

  // Initial load
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Real-time WebSocket connection (Primary event source)
  useEffect(() => {
    if (!pin) return;

    const ws = createLobbySocket(
      pin,
      (msg) => {
        if (msg.type === 'lobby_state') {
          setSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: msg.status ?? prev.status,
              participants: msg.participants ?? prev.participants,
              participant_count: msg.participant_count ?? prev.participant_count,
              submissions_count: msg.submissions_count ?? prev.submissions_count,
              pending_participants: msg.pending_participants ?? prev.pending_participants,
              pending_count: msg.pending_count ?? prev.pending_count,
              seconds_remaining: msg.seconds_remaining ?? prev.seconds_remaining,
            };
          });
        } else if (msg.event === 'quiz_start') {
          setSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: 'ACTIVE',
              seconds_remaining: msg.seconds_remaining ?? prev.seconds_remaining,
              total_time_limit: msg.total_time_limit ?? prev.total_time_limit,
              quiz_started_at: msg.quiz_started_at ?? prev.quiz_started_at,
            };
          });
          loadState();
        } else if (msg.event === 'submission_update') {
          setSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              submissions_count: msg.submissions_count ?? prev.submissions_count,
              participant_count: msg.participant_count ?? prev.participant_count,
            };
          });
        } else if (msg.event === 'quiz_complete') {
          setSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: 'COMPLETED',
            };
          });
        } else if (msg.event === 'participant_kicked' || msg.event === 'participant_admitted') {
          loadState();
        }
      },
      (status) => {
        if (status === 'connected') {
          setWsConnected(true);
          setIsReconnecting(false);
        } else if (status === 'disconnected') {
          setWsConnected(false);
          setIsReconnecting(true);
        }
      }
    );

    return () => ws.close();
  }, [pin, loadState]);

  // Polling fallback: Only runs as a slow recovery heartbeat (every 15s) or faster (5s) if WS dropped
  useEffect(() => {
    if (!pin) return;
    const intervalTime = wsConnected ? 15000 : 5000;
    const interval = setInterval(() => {
      loadState();
    }, intervalTime);
    return () => clearInterval(interval);
  }, [pin, loadState, wsConnected]);

  if (!pin) {
    return (
      <div className="min-h-screen bg-[#f7f5ef] flex flex-col items-center justify-center p-6 text-center">
        <div className="kz-card p-8 max-w-md w-full bg-white border-2 border-[#191817] shadow-[4px_4px_0_#191817] rounded-3xl">
          <h2 className="text-2xl font-extrabold text-[#191817] mb-2">No Game PIN provided</h2>
          <p className="text-sm text-[#77736c] mb-6">Enter a 5-letter Game PIN to join a live quiz.</p>
          <a href="/join/" className="kz-btn-primary px-6 py-2.5 rounded-xl font-bold text-sm block">
            Enter Game PIN
          </a>
        </div>
      </div>
    );
  }

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-[#f7f5ef] flex items-center justify-center">
        <div className="text-center font-bold text-[#6c4de8] text-lg animate-pulse">
          Connecting to Koozy Live Session...
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-[#f7f5ef] flex flex-col items-center justify-center p-6 text-center">
        <div className="kz-card p-8 max-w-md w-full bg-white border-2 border-[#191817] shadow-[4px_4px_0_#191817] rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-[#fee2e2] text-[#ff0000] mx-auto flex items-center justify-center mb-4 border border-[#fca5a5]">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-2xl font-black text-[#191817] mb-2">Session Not Found</h2>
          <p className="text-sm text-[#77736c] mb-6">The Game PIN was not recognized or the session has ended.</p>
          <a href="/join/" className="kz-btn-primary px-6 py-2.5 rounded-xl font-bold text-sm block">
            Back to Join
          </a>
        </div>
      </div>
    );
  }

  const participant = session?.participant;

  // Section 15: Kicked participant enforcement screen
  if (!isHost && participant?.is_kicked) {
    return (
      <div className="min-h-screen bg-[#f7f5ef] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="kz-card p-8 max-w-md w-full bg-white border-2 border-[#191817] shadow-[4px_4px_0_#191817] rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#ff0000] mx-auto flex items-center justify-center mb-4 border-2 border-[#191817] shadow-[2px_2px_0_#191817]">
            <UserX size={24} />
          </div>
          <h2 className="text-2xl font-black text-[#191817] mb-2">Removed from Quiz</h2>
          <p className="text-sm text-[#77736c] mb-6">
            You've been removed from this quiz. Ask the host if you need to rejoin.
          </p>
          <button
            onClick={() => {
              clearParticipantToken(pin);
              window.location.href = '/join/';
            }}
            className="kz-btn-primary px-6 py-2.5 rounded-xl font-bold text-sm block w-full cursor-pointer"
          >
            Join Another Room
          </button>
        </div>
      </div>
    );
  }

  const status = session?.status || 'WAITING';
  const hasSubmitted = Boolean(localSubmitted || participant?.has_submitted || participant?.submitted_at);
  const isPendingAdmission = !isHost && participant?.is_admitted === false;

  return (
    <div className="min-h-screen bg-[#f7f5ef] flex flex-col">
      <Navbar
        title={session?.quiz_title}
        pin={session?.game_pin}
        isHost={isHost}
        participantName={participant?.display_name}
        isReconnecting={isReconnecting}
        onExit={() => {
          if (window.confirm('Leave this live quiz session?')) {
            clearParticipantToken(pin);
            window.location.href = isHost ? '/host/quizzes/' : '/';
          }
        }}
      />

      <main className="flex-1 flex flex-col justify-center">
        {/* HOST SCREENS */}
        {isHost ? (
          status === 'WAITING' ? (
            <HostLobby session={session} onStartSuccess={loadState} />
          ) : status === 'ACTIVE' || hostSettling ? (
            <HostLiveDashboard
              session={session}
              isSettling={hostSettling}
              onEndSuccess={() => {
                setHostSettling(false);
                loadState();
              }}
              onStartSettling={() => setHostSettling(true)}
            />
          ) : (
            <HostResults session={session} />
          )
        ) : (
          /* PARTICIPANT SCREENS */
          status === 'COMPLETED' && hasSubmitted ? (
            <ParticipantResults session={session} participant={participant} />
          ) : status === 'WAITING' || isPendingAdmission ? (
            <ParticipantLobby session={session} participant={participant} />
          ) : hasSubmitted ? (
            <ParticipantSubmittedWaiting session={session} participant={participant} />
          ) : (
            <ParticipantQuiz
              session={session}
              participant={participant}
              onSubmitSuccess={() => {
                setLocalSubmitted(true);
                loadState();
              }}
            />
          )
        )}
      </main>
    </div>
  );
}
