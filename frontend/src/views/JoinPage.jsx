import React, { useState } from 'react';
import { Gamepad2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { joinGame, setParticipantToken } from '../utils/api';
import UserProfileBadge from '../components/UserProfileBadge';
import { playSfx } from '../utils/sfx';
import { trackPlayerJoined } from '../utils/analytics';

export default function JoinPage({ initialPin = '', onJoinSuccess = null }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState(() => {
    if (initialPin) return initialPin;
    if (typeof window !== 'undefined') {
      const qp = new URLSearchParams(window.location.search).get('pin');
      if (qp) return qp.toUpperCase();
      const match = window.location.pathname.match(/\/join\/([A-Za-z0-9]{5})/i);
      if (match) return match[1].toUpperCase();
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    playSfx('button');
    if (!name.trim()) {
      setError('Please enter your nickname');
      playSfx('error');
      return;
    }
    if (!pin.trim()) {
      setError('Please enter a Game PIN');
      playSfx('error');
      return;
    }

    setLoading(true);
    setError('');
    const cleanPin = pin.trim().toUpperCase();

    try {
      const res = await joinGame(cleanPin, name.trim());
      trackPlayerJoined(cleanPin, res.join_token);
      playSfx('koozy-connect');
      setParticipantToken(res.join_token, cleanPin);
      if (onJoinSuccess) {
        onJoinSuccess(cleanPin, res.join_token);
      } else {
        setTimeout(() => {
          window.location.href = `/join/${cleanPin}/lobby/?pt=${res.join_token}`;
        }, 500);
      }
    } catch (err) {
      playSfx('koozy-unsucess');
      setError(err.message || 'Could not join session. Check Game PIN.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Top Navbar */}
      <nav className="flex justify-between items-center pb-6 border-b border-[#d8d3ca] mb-8">
        <a href="/" className="font-hand text-4xl text-[#191817] hover:text-[#6c4de8] transition-colors -rotate-2 select-none">
          Koozy
        </a>
        <div className="flex gap-3 items-center">
          <a
            href="/"
            className="kz-btn-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Home</span>
          </a>
          <UserProfileBadge />
        </div>
      </nav>

      <div className="min-h-[60vh] flex flex-col items-center justify-center p-2 text-center">
        <div className="inline-block font-hand text-3xl text-[#6c4de8] -rotate-2 mb-2 select-none">
          ready to play? ✦
        </div>

        <div className="kz-card p-8 md:p-10 max-w-md w-full bg-[#fffdf7] border-2 border-[#191817] shadow-[4px_4px_0_#191817]">
          <div className="w-12 h-12 rounded-2xl bg-[#eeeafd] text-[#6c4de8] border-2 border-[#191817] flex items-center justify-center shadow-[3px_3px_0_#191817] mx-auto mb-4">
            <Gamepad2 size={24} />
          </div>

          <h1 className="text-3xl font-extrabold text-[#191817] mb-1">
            Join Live Quiz
          </h1>
          <p className="text-sm text-[#77736c] mb-6">
            Enter your nickname and the room Game PIN to join the session.
          </p>

          <form onSubmit={handleJoin} className="space-y-4 text-left">
            {/* 1. NICKNAME FIRST (Per spec section 6) */}
            <div>
              <label htmlFor="join-nickname-input" className="block text-xs font-bold uppercase tracking-wider text-[#77736c] mb-1.5">
                Your Nickname
              </label>
              <input
                id="join-nickname-input"
                type="text"
                placeholder="e.g. Sam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 bg-white border-2 border-[#d8d3ca] focus:border-[#6c4de8] rounded-xl text-base font-semibold outline-none transition-colors"
              />
            </div>

            {/* 2. GAME PIN SECOND (Per spec section 6) */}
            <div>
              <label htmlFor="join-gamepin-input" className="block text-xs font-bold uppercase tracking-wider text-[#77736c] mb-1.5">
                Game PIN
              </label>
              <input
                id="join-gamepin-input"
                type="text"
                placeholder="e.g. FAY2A"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                maxLength={5}
                className="w-full px-4 py-3 bg-white border-2 border-[#d8d3ca] focus:border-[#6c4de8] rounded-xl font-mono text-center text-2xl font-black tracking-widest uppercase outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 bg-[#fee2e2] text-[#b91c1c] text-xs font-bold rounded-xl border border-[#fca5a5]">
                {error}
              </div>
            )}

            {/* 3. ENTER WAITING ROOM BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="kz-btn-primary w-full py-3.5 rounded-xl font-bold text-sm cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <span>{loading ? 'Entering Room...' : 'Enter Waiting Room →'}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#d8d3ca] text-xs text-[#77736c]">
            Hosting a quiz? <a href="/host/quizzes/" className="font-bold text-[#6c4de8] hover:underline">Host Dashboard</a>
          </div>
        </div>
      </div>
    </div>
  );
}
