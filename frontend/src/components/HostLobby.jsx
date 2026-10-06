import React, { useState } from 'react';
import { Users, Play, Copy, Check, Clock, UserCheck, AlertCircle } from 'lucide-react';
import { kickParticipant, admitParticipant, startQuiz } from '../utils/api';
import { playSfx } from '../utils/sfx';

export default function HostLobby({ session, onStartSuccess }) {
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [admittingId, setAdmittingId] = useState(null);

  // Initial timer state parsed from session total_time_limit (default 300s = 5m)
  const initialSeconds = session.total_time_limit || 300;
  const [hours, setHours] = useState(() => Math.floor(initialSeconds / 3600));
  const [minutes, setMinutes] = useState(() => Math.floor((initialSeconds % 3600) / 60));
  const [seconds, setSeconds] = useState(() => initialSeconds % 60);

  const participants = session.participants || [];
  const pendingParticipants = session.pending_participants || [];
  const count = session.participant_count || participants.length;

  const handleCopyPin = () => {
    playSfx('tick-immersive');
    navigator.clipboard.writeText(session.game_pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKick = async (id, name) => {
    if (!window.confirm(`Kick ${name} from the lobby?`)) return;
    try {
      playSfx('disconnect');
      await kickParticipant(session.game_pin, id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdmit = async (id) => {
    setAdmittingId(id);
    playSfx('success');
    try {
      await admitParticipant(session.game_pin, id);
      setAdmittingId(null);
    } catch (err) {
      console.error(err);
      setAdmittingId(null);
    }
  };

  const calculateTotalSeconds = () => {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const s = parseInt(seconds, 10) || 0;
    const total = h * 3600 + m * 60 + s;
    return total > 0 ? total : 300;
  };

  const handleStart = async () => {
    const totalSeconds = calculateTotalSeconds();
    setStarting(true);
    setError('');
    playSfx('button');
    try {
      const res = await startQuiz(session.game_pin, totalSeconds);
      playSfx('success');
      if (onStartSuccess) onStartSuccess(res);
    } catch (err) {
      playSfx('error');
      setError(err.message || 'Failed to start quiz');
      setStarting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 text-center">
      <div className="inline-block font-hand text-3xl text-[#6c4de8] -rotate-2 mb-2 select-none">
        tell everyone the PIN ✦
      </div>

      <div className="kz-card p-8 md:p-12 mb-8 relative overflow-hidden bg-[#fffdf7] border-2 border-[#191817] shadow-[4px_4px_0_#191817]">
        <p className="text-xs uppercase font-bold tracking-widest text-[#77736c] mb-1">
          {session.quiz_title || 'Live Quiz'}
        </p>

        <div className="flex items-center justify-center gap-3 my-3">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-mono font-black tracking-widest text-[#191817] select-all">
            {session.game_pin}
          </h1>
          <button
            onClick={handleCopyPin}
            className="p-3.5 bg-white hover:bg-[#eeeafd] text-[#191817] hover:text-[#6c4de8] rounded-2xl border-2 border-[#191817] shadow-[2px_2px_0_#191817] transition-all cursor-pointer"
            title="Copy Game PIN"
          >
            {copied ? <Check size={22} className="text-[#00cc05]" /> : <Copy size={22} />}
          </button>
        </div>

        <p className="text-[#77736c] text-sm md:text-base font-medium">
          Participants join at <span className="font-bold text-[#191817] underline decoration-[#6c4de8] decoration-2">{window.location.host}/join/</span>
        </p>

        {/* Admitted Participant Roster */}
        <div className="mt-8 pt-8 border-t border-[#d8d3ca]">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users size={18} className="text-[#6c4de8]" />
            <span className="font-bold text-sm text-[#191817]">
              {count} Player{count === 1 ? '' : 's'} in Lobby
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 min-h-[70px] max-h-[200px] overflow-y-auto p-2">
            {participants.length > 0 ? (
              participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white border-2 border-[#191817] rounded-xl shadow-[2.5px_2.5px_0_#191817] text-sm font-bold text-[#191817] animate-fadeIn"
                >
                  <span>{p.display_name}</span>
                  <button
                    onClick={() => handleKick(p.id, p.display_name)}
                    className="text-[#77736c] hover:text-[#ff0000] p-0.5 rounded cursor-pointer transition-colors text-base font-black leading-none"
                    title="Remove player"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#77736c] italic flex items-center justify-center w-full">
                Waiting for players to join with the PIN...
              </p>
            )}
          </div>
        </div>

        {/* Pending Late Joiners (Section 10 & 11) */}
        {pendingParticipants.length > 0 && (
          <div className="mt-6 p-4 bg-[#fff3cd] border-2 border-[#856404] rounded-2xl text-left animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#856404] mb-2">
              <UserCheck size={16} />
              <span>Waiting for Host Admission ({pendingParticipants.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pendingParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#856404] rounded-xl text-xs font-bold"
                >
                  <span>{p.display_name}</span>
                  <button
                    onClick={() => handleAdmit(p.id)}
                    disabled={admittingId === p.id}
                    className="bg-[#6c4de8] text-white px-2 py-0.5 rounded-lg text-[11px] hover:bg-[#5838d6] cursor-pointer"
                  >
                    {admittingId === p.id ? 'Admitting...' : 'Admit →'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TIMER SELECTION UI (Spec Section 9) */}
        <div className="mt-8 pt-8 border-t border-[#d8d3ca] max-w-md mx-auto">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#77736c] mb-3">
            <Clock size={15} className="text-[#6c4de8]" />
            <span>Quiz Time Limit (Global Timer)</span>
          </div>

          <div className="flex items-center justify-center gap-2 bg-white p-3 rounded-2xl border-2 border-[#191817] shadow-[3px_3px_0_#191817]">
            <div className="flex flex-col items-center">
              <label htmlFor="timer-hours-input" className="text-[10px] font-bold text-[#77736c] uppercase mb-1">Hour</label>
              <input
                id="timer-hours-input"
                type="number"
                min="0"
                max="23"
                value={hours.toString().padStart(2, '0')}
                onChange={(e) => {
                  playSfx('tick-immersive');
                  setHours(Math.max(0, parseInt(e.target.value, 10) || 0));
                }}
                className="w-16 py-1.5 text-center font-mono font-extrabold text-xl bg-[#f7f5ef] border border-[#d8d3ca] rounded-lg focus:border-[#6c4de8] outline-none"
              />
            </div>

            <span className="font-mono text-2xl font-black text-[#77736c] pt-4">:</span>

            <div className="flex flex-col items-center">
              <label htmlFor="timer-minutes-input" className="text-[10px] font-bold text-[#77736c] uppercase mb-1">Min</label>
              <input
                id="timer-minutes-input"
                type="number"
                min="0"
                max="59"
                value={minutes.toString().padStart(2, '0')}
                onChange={(e) => {
                  playSfx('tick-immersive');
                  setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)));
                }}
                className="w-16 py-1.5 text-center font-mono font-extrabold text-xl bg-[#f7f5ef] border border-[#d8d3ca] rounded-lg focus:border-[#6c4de8] outline-none"
              />
            </div>

            <span className="font-mono text-2xl font-black text-[#77736c] pt-4">:</span>

            <div className="flex flex-col items-center">
              <label htmlFor="timer-seconds-input" className="text-[10px] font-bold text-[#77736c] uppercase mb-1">Sec</label>
              <input
                id="timer-seconds-input"
                type="number"
                min="0"
                max="59"
                value={seconds.toString().padStart(2, '0')}
                onChange={(e) => {
                  playSfx('tick-immersive');
                  setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)));
                }}
                className="w-16 py-1.5 text-center font-mono font-extrabold text-xl bg-[#f7f5ef] border border-[#d8d3ca] rounded-lg focus:border-[#6c4de8] outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-[#fee2e2] text-[#ff0000] text-sm font-semibold rounded-xl border border-[#fca5a5]">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleStart}
            disabled={starting || session.question_count === 0}
            className="kz-btn-primary px-10 py-4 rounded-2xl font-bold text-lg flex items-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={20} fill="currentColor" />
            <span>{starting ? 'Starting Quiz...' : 'Start Quiz →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
