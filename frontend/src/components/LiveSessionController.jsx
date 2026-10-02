import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './Navbar';
import HostLobby from './HostLobby';
import HostLiveDashboard from './HostLiveDashboard';
import HostResults from './HostResults';
import ParticipantLobby from './ParticipantLobby';
import ParticipantQuiz from './ParticipantQuiz';
import ParticipantResults from './ParticipantResults';
import ParticipantSubmittedWaiting from './ParticipantSubmittedWaiting';
import { fetchSessionState, clearParticipantToken } from '../utils/api';
import { createLobbySocket } from '../utils/websocket';
import { AlertTriangle, UserX } from 'lucide-react';
import { playSfx } from '../utils/sfx';
import { startMusic, stopMusic } from '../utils/bgMusic';

export default function LiveSessionController({ pin, isHost, config = {} }) {
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

  // Background music management synchronized with session state
  useEffect(() => {
    if (!session) return;
    if (session.status === 'ACTIVE' && session.music_track) {
      startMusic(session.music_track, session.quiz_started_at);
    } else if (session.status === 'COMPLETED' || session.status === 'WAITING') {
      stopMusic();
    }
  }, [session?.status, session?.music_track, session?.quiz_started_at]);

  // Clean up on component unmount (leaving live session)
  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, []);

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
              quiz_started_at: msg.quiz_started_at ?? prev.quiz_started_at,
              music_track: msg.music_track ?? prev.music_track,
            };
          });
        } else if (msg.event === 'quiz_start') {
          playSfx('success');
          setSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: 'ACTIVE',
              seconds_remaining: msg.seconds_remaining ?? prev.seconds_remaining,
              total_time_limit: msg.total_time_limit ?? prev.total_time_limit,
              quiz_started_at: msg.quiz_started_at ?? prev.quiz_started_at,
              music_track: msg.music_track ?? prev.music_track,
            };
          });
          if (msg.music_track) {
            startMusic(msg.music_track, msg.quiz_started_at);
          }
          loadState();
        } else if (msg.event === 'submission_update') {
          playSfx('tick-immersive');
          setSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              submissions_count: msg.submissions_count ?? prev.submissions_count,
              participant_count: msg.participant_count ?? prev.participant_count,
            };
          });
        } else if (msg.event === 'quiz_complete') {
          playSfx('koozy-success');
          stopMusic();
          setSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: 'COMPLETED',
            };
          });
        } else if (msg.event === 'participant_kicked' || msg.event === 'participant_admitted') {
          if (msg.event === 'participant_kicked') playSfx('koozy-disconnect');
          if (msg.event === 'participant_admitted') playSfx('koozy-connect');
          loadState();
        }
      },
      (status) => {
        if (status === 'connected') {
          playSfx('koozy-connect');
          setWsConnected(true);
          setIsReconnecting(false);
        } else if (status === 'disconnected') {
          playSfx('koozy-disconnect');
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
            stopMusic();
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
