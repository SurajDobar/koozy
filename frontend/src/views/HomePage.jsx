import React from 'react';
import { ArrowRight, Gamepad2 } from 'lucide-react';
import UserProfileBadge from '../components/UserProfileBadge';

export default function HomePage({ user = null }) {
  const config = typeof window !== 'undefined' ? (window.__KOOZY_CONFIG__ || {}) : {};
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

        {/* Tilted & Titled YouTube Video Card (Calibrated height & placement to barely clear the text) */}
        <div className="mt-8 lg:mt-0 lg:absolute lg:right-0 xl:right-2 lg:bottom-10 xl:bottom-10 z-20 w-full max-w-xs sm:max-w-sm lg:w-[260px] xl:w-[285px] transition-all duration-300 ease-out group hover:scale-[1.02] rotate-1.5 sm:rotate-2 hover:rotate-0">
          <div className="kz-card-tactile bg-white p-2 sm:p-2.5 border-2 border-[#191817] shadow-[4px_4px_0_#191817] rounded-2xl text-left">
            {/* Window Header / Title Bar */}
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#d8d3ca]">
              <div className="flex items-center gap-1 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#ff5f56] border border-[#191817]"></span>
                <span className="w-2 h-2 rounded-full bg-[#ffbd2e] border border-[#191817]"></span>
                <span className="w-2 h-2 rounded-full bg-[#27c93f] border border-[#191817]"></span>
                <span className="ml-1.5 font-mono text-[10px] sm:text-[11px] font-bold text-[#191817] truncate">
                  Koozy is liveee ✦
                </span>
              </div>
              <span className="shrink-0 text-[9px] font-mono font-bold uppercase tracking-wider text-[#6c4de8] bg-[#eeeafd] px-1.5 py-0.5 rounded-full border border-[#c9bfff]">
                Demo
              </span>
            </div>

            {/* Video Player Container */}
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-[#191817] bg-[#191817]">
              <iframe
                src="https://www.youtube-nocookie.com/embed/y8F1BwhzwfQ?rel=0"
                title="Koozy is liveee"
                className="w-full h-full block"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>

            {/* Footer Caption */}
            <div className="mt-1.5 pt-0.5 flex items-center justify-between text-[10px] font-hand text-[#77736c] select-none">
              <span className="flex items-center gap-1">
                <span className="text-[#ff0000]">▶</span> Watch in action
              </span>
              <span className="text-[#6c4de8] font-bold group-hover:translate-x-0.5 transition-transform">
                see it live ✦
              </span>
            </div>
          </div>
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
