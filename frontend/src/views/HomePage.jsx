import React from 'react';
import { ArrowRight, Gamepad2 } from 'lucide-react';
import UserProfileBadge from '../components/UserProfileBadge';

export default function HomePage({ user = null }) {
  const config = window.__KOOZY_CONFIG__ || {};
  const activeUser = user || config.user || null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 min-h-[90vh] flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="flex justify-between items-center pb-6 border-b border-[#d8d3ca]">
        <a href="/" className="font-hand text-4xl text-[#191817] hover:text-[#6c4de8] transition-colors -rotate-2 select-none">
          Koozy
        </a>
        <div className="flex gap-3 sm:gap-4 items-center">
          <a href="/join/" className="text-sm font-semibold text-[#191817] hover:text-[#6c4de8] transition-colors">
            Join Room
          </a>

          <UserProfileBadge user={activeUser} />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center relative my-auto py-12 md:py-20">
        <div className="hidden md:block absolute left-4 top-8 font-hand text-2xl text-[#77736c] -rotate-6 select-none">
          learning doesn't have to be boring ✦
        </div>
        <div className="hidden md:block absolute right-6 bottom-8 font-hand text-2xl text-[#77736c] rotate-6 select-none">
          ready? <span className="text-[#6c4de8]">→</span>
        </div>

        <div className="inline-block text-xs uppercase font-extrabold tracking-widest text-[#6c4de8] mb-3 bg-[#eeeafd] px-3.5 py-1.5 rounded-full border border-[#c9bfff]">
          A little quiz, a lot of chaos.
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-[#191817] max-w-4xl leading-[0.95] my-4">
          Make learning <span className="font-hand text-[#6c4de8] font-normal">play.</span>
        </h1>

        <p className="text-[#77736c] text-base md:text-lg max-w-xl mx-auto mt-2 mb-10 leading-relaxed">
          Create a quiz, share a 5-letter PIN, and get everyone answering on a global timer. Simple for hosts. Fast for players.
        </p>

        {/* The Two Primary V1 CTAs */}
        <div className="flex flex-wrap gap-4 justify-center items-center">
          <a
            href="/host/quizzes/"
            className="kz-btn-primary px-8 py-3.5 rounded-xl font-bold text-base flex items-center gap-2"
          >
            <span>{activeUser?.is_authenticated ? 'Host Dashboard →' : 'Host a Quiz'}</span>
            <ArrowRight size={18} />
          </a>
          <a
            href="/join/"
            className="kz-btn-secondary px-8 py-3.5 rounded-xl font-bold text-base flex items-center gap-2"
          >
            <Gamepad2 size={18} className="text-[#6c4de8]" />
            <span>Join a Quiz</span>
          </a>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="pt-6 border-t border-[#d8d3ca] text-center text-xs text-[#77736c] flex flex-wrap justify-between items-center gap-4">
        <span className="font-hand text-xl text-[#191817]">Koozy — Live Learning Play</span>
        <span>Built for fast, interactive multiplayer quizzes.</span>
      </footer>
    </div>
  );
}
