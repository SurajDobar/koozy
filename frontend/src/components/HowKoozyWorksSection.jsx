import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Play,
  Copy,
  Check,
  Clock,
  Trophy,
  CheckCircle2,
  Send,
  Gamepad2,
  ChevronUp
} from 'lucide-react';
import { playSfx } from '../utils/sfx';

export default function HowKoozyWorksSection() {
  const [role, setRole] = useState('host'); // 'host' | 'player'
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    playSfx('tick-immersive');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = (newRole) => {
    playSfx('button');
    setRole(newRole);
  };

  // Ultra-concise human copy (readable in 1 to 2 seconds)
  const hostCards = [
    {
      letter: 'A',
      num: '01',
      tag: 'CREATE',
      title: 'Make your quiz',
      desc: 'Set details manually or generate in 5 seconds with Gemini AI.',
      theme: {
        bg: '#e6f9ff',
        border: '#05cdff',
        text: '#034a6e',
        badgeBg: '#05cdff',
      },
      renderVisual: () => <HostCreateVisual />,
    },
    {
      letter: 'B',
      num: '02',
      tag: 'SHARE',
      title: 'Share the PIN',
      desc: 'Players join with a 5-letter code. Zero app install.',
      theme: {
        bg: '#ffebe8',
        border: '#ff0000',
        text: '#990000',
        badgeBg: '#ff0000',
      },
      renderVisual: () => <HostShareVisual copied={copied} onCopy={handleCopy} />,
    },
    {
      letter: 'C',
      num: '03',
      tag: 'MANAGE',
      title: 'Run the live game',
      desc: 'Sync the timer, track live answers, and control the pace.',
      theme: {
        bg: '#e6ffe6',
        border: '#00cc05',
        text: '#08660a',
        badgeBg: '#00cc05',
      },
      renderVisual: () => <HostManageVisual />,
    },
    {
      letter: 'D',
      num: '04',
      tag: 'RESULTS',
      title: 'Crown the podium',
      desc: 'Instant leaderboard, accuracy stats, and podium finish.',
      theme: {
        bg: '#f3eaff',
        border: '#8000ff',
        text: '#4a0099',
        badgeBg: '#8000ff',
      },
      renderVisual: () => <HostResultsVisual />,
    },
  ];

  const playerCards = [
    {
      letter: 'A',
      num: '01',
      tag: 'JOIN',
      title: 'Enter the PIN',
      desc: 'Type your nickname and 5-letter PIN on any device.',
      theme: {
        bg: '#e6f9ff',
        border: '#05cdff',
        text: '#034a6e',
        badgeBg: '#05cdff',
      },
      renderVisual: () => <PlayerJoinVisual />,
    },
    {
      letter: 'B',
      num: '02',
      tag: 'WAIT',
      title: 'Waiting in lobby',
      desc: 'See players in the room while the host prepares to launch.',
      theme: {
        bg: '#ffebe8',
        border: '#ff0000',
        text: '#990000',
        badgeBg: '#ff0000',
      },
      renderVisual: () => <PlayerWaitVisual />,
    },
    {
      letter: 'C',
      num: '03',
      tag: 'PLAY',
      title: 'Answer on screen',
      desc: 'Questions and choices directly on your screen. Tap to answer.',
      theme: {
        bg: '#e6ffe6',
        border: '#00cc05',
        text: '#08660a',
        badgeBg: '#00cc05',
      },
      renderVisual: () => <PlayerPlayVisual />,
    },
    {
      letter: 'D',
      num: '04',
      tag: 'RESULTS',
      title: 'Instant scorecard',
      desc: 'See accuracy %, your rank, and answer breakdown.',
      theme: {
        bg: '#f3eaff',
        border: '#8000ff',
        text: '#4a0099',
        badgeBg: '#8000ff',
      },
      renderVisual: () => <PlayerResultsVisual />,
    },
  ];

  const currentCards = role === 'host' ? hostCards : playerCards;

  return (
    <section id="how-koozy-works" className="py-10 md:py-16 border-t border-[#d8d3ca] relative">
      {/* 
        Section Header:
        The title and subtitle remain in normal flow at the top of the section.
      */}
      <div className="max-w-2xl mx-auto px-4 text-center mb-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#191817] tracking-tight">
          See how Koozy works
        </h2>
        <p className="font-hand text-base sm:text-lg text-[#77736c] font-normal mt-1">
          Pick your role to see the flow ✦
        </p>
      </div>

      {/* 
        Sticky Role Buttons Bar:
        ONLY the Host and Player buttons stick at top-14 when scrolling down through the section.
        When scrolled up to the top, the header naturally sits above it.
      */}
      <div className="sticky top-14 z-30 flex justify-center py-2.5 bg-[#f7f5ef]/90 backdrop-blur-xs mb-8">
        <div className="inline-flex p-1 bg-white border-2 border-[#191817] rounded-xl shadow-[3px_3px_0_#191817]">
          <button
            type="button"
            onClick={() => handleRoleChange('host')}
            className={`px-6 py-2 rounded-lg font-black text-sm transition-all cursor-pointer ${
              role === 'host'
                ? 'bg-[#6c4de8] text-white shadow-[1.5px_1.5px_0_#191817] border border-[#191817]'
                : 'text-[#191817] hover:text-[#6c4de8]'
            }`}
            aria-pressed={role === 'host'}
          >
            Host
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('player')}
            className={`px-6 py-2 rounded-lg font-black text-sm transition-all cursor-pointer ${
              role === 'player'
                ? 'bg-[#00cc05] text-[#191817] shadow-[1.5px_1.5px_0_#191817] border border-[#191817]'
                : 'text-[#191817] hover:text-[#08660a]'
            }`}
            aria-pressed={role === 'player'}
          >
            Player
          </button>
        </div>
      </div>

      {/* Cascading Stacking Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative pb-16">
        {currentCards.map((card, idx) => {
          const topStickyOffset = 135 + idx * 22;

          return (
            <div
              key={`${role}-${card.letter}`}
              className="sticky mb-10 transition-all duration-300"
              style={{
                top: `${topStickyOffset}px`,
                zIndex: 10 + idx,
              }}
            >
              <div
                className="p-5 sm:p-7 border-2 border-[#191817] shadow-[5px_5px_0_#191817] rounded-3xl transition-transform"
                style={{
                  backgroundColor: card.theme.bg,
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 items-center">
                  {/* Left Column: Letter pill + Human-ready text (5 cols) */}
                  <div className="md:col-span-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div
                        className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-mono font-black text-lg border-2 border-[#191817] shadow-[1.5px_1.5px_0_#191817] shrink-0"
                        style={{ backgroundColor: card.theme.badgeBg }}
                      >
                        {card.letter}
                      </div>

                      <span className="font-mono text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-[#191817] text-[#191817]">
                        Step {card.num}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-[#191817] tracking-tight mb-1.5">
                      {card.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#191817]/80 font-medium leading-snug">
                      {card.desc}
                    </p>
                  </div>

                  {/* Right Column: Mini UI Mockup Card (7 cols) */}
                  <div className="md:col-span-7">
                    <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-[#191817] shadow-[3px_3px_0_#191817]">
                      {card.renderVisual()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================================
   HOST UI PLACEHOLDERS (Matching user screenshots exactly)
   ========================================================================= */

function HostCreateVisual() {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 text-[#191817] border-2 border-[#191817] shadow-[3px_3px_0_#191817]">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="font-hand text-sm font-bold text-[#6c4de8] block leading-none mb-1">
            step 1 of 2 ✦
          </span>
          <h4 className="text-xl font-black text-[#191817] tracking-tight leading-tight">
            Create New Quiz
          </h4>
        </div>

        <button
          type="button"
          onClick={() => playSfx('button')}
          className="kz-btn-primary px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shrink-0 shadow-[2px_2px_0_#191817] cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#ffbd2e]" />
          <span>Generate with AI</span>
        </button>
      </div>

      <div className="space-y-2.5 text-left mb-3">
        <div>
          <label className="block text-[10px] font-bold text-[#191817] uppercase tracking-wider mb-1">
            QUIZ TITLE *
          </label>
          <div className="w-full bg-[#fcfbf9] border-2 border-[#d8d3ca] rounded-xl px-3 py-1.5 text-xs text-[#191817] font-medium">
            Python Fundamentals Quick Check
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#191817] uppercase tracking-wider mb-1">
            DESCRIPTION (OPTIONAL)
          </label>
          <div className="w-full bg-[#fcfbf9] border-2 border-[#d8d3ca] rounded-xl px-3 py-1.5 text-xs text-[#77736c]">
            Short summary for your students...
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[9px] font-bold text-[#191817] uppercase mb-0.5">
              CATEGORY
            </label>
            <div className="bg-[#fcfbf9] border-2 border-[#d8d3ca] rounded-xl px-2 py-1 text-xs font-semibold text-[#191817]">
              General
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-[#191817] uppercase mb-0.5">
              DIFFICULTY
            </label>
            <div className="bg-[#fcfbf9] border-2 border-[#d8d3ca] rounded-xl px-2 py-1 text-xs font-semibold text-[#191817] flex items-center justify-between">
              <span>Medium</span>
              <span className="text-[9px] text-[#77736c]">▼</span>
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-[#191817] uppercase mb-0.5">
              TIME (SEC)
            </label>
            <div className="bg-[#fcfbf9] border-2 border-[#d8d3ca] rounded-xl px-2 py-1 text-xs font-mono font-semibold text-[#191817]">
              300
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#f0ece1]">
        <button
          type="button"
          onClick={() => playSfx('button')}
          className="px-3 py-1.5 rounded-xl border-2 border-[#191817] text-xs font-bold bg-white text-[#191817] cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => playSfx('button')}
          className="kz-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-black shadow-[2px_2px_0_#191817] cursor-pointer"
        >
          Save & Add Questions &rarr;
        </button>
      </div>
    </div>
  );
}

function HostShareVisual({ copied, onCopy }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 text-[#191817] border-2 border-[#191817] shadow-[3px_3px_0_#191817] text-center max-w-sm mx-auto">
      <span className="font-mono text-[11px] font-bold tracking-widest text-[#77736c] uppercase block mb-1">
        ASDF
      </span>

      <div className="flex items-center justify-center gap-3 my-1">
        <div className="font-mono font-black text-4xl sm:text-5xl tracking-widest text-[#191817]">
          S4QQG
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="w-10 h-10 rounded-xl border-2 border-[#191817] bg-white flex items-center justify-center shadow-[1.5px_1.5px_0_#191817] hover:bg-[#f7f5ef] transition-colors cursor-pointer"
          title="Copy PIN"
        >
          {copied ? (
            <Check className="w-5 h-5 text-[#00cc05]" />
          ) : (
            <Copy className="w-5 h-5 text-[#191817]" />
          )}
        </button>
      </div>

      <div className="text-xs text-[#191817] font-medium mb-3">
        Participants join at <span className="font-bold underline text-[#191817]">koozy.live/join/</span>
      </div>

      <div className="border-t border-[#e5e0d8] my-3"></div>

      <div className="my-2.5">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#6c4de8] mb-1">
          <Users className="w-4 h-4" />
          <span>0 Players in Lobby</span>
        </div>
        <span className="italic text-xs text-[#77736c]">
          Waiting for players to join with the PIN...
        </span>
      </div>

      <div className="border-t border-[#e5e0d8] my-3"></div>

      <div className="mb-3">
        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#6c4de8] uppercase mb-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>QUIZ TIME LIMIT (GLOBAL TIMER)</span>
        </div>

        <div className="border-2 border-[#191817] rounded-2xl p-2.5 bg-white shadow-[2px_2px_0_#191817] inline-flex items-center justify-center gap-2">
          <div className="text-center">
            <span className="block text-[8px] font-mono text-[#77736c] uppercase">HOUR</span>
            <div className="bg-[#f7f5ef] border border-[#d8d3ca] rounded-lg px-2.5 py-0.5 font-mono font-bold text-sm">
              00
            </div>
          </div>
          <span className="font-mono font-bold text-sm">:</span>
          <div className="text-center">
            <span className="block text-[8px] font-mono text-[#77736c] uppercase">MIN</span>
            <div className="bg-[#f7f5ef] border border-[#d8d3ca] rounded-lg px-2.5 py-0.5 font-mono font-bold text-sm">
              05
            </div>
          </div>
          <span className="font-mono font-bold text-sm">:</span>
          <div className="text-center">
            <span className="block text-[8px] font-mono text-[#77736c] uppercase">SEC</span>
            <div className="bg-[#f7f5ef] border border-[#d8d3ca] rounded-lg px-2.5 py-0.5 font-mono font-bold text-sm">
              00
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => playSfx('button')}
        className="kz-btn-primary w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-[2.5px_2.5px_0_#191817] cursor-pointer"
      >
        <Play className="w-4 h-4 fill-white" />
        <span>Start Quiz &rarr;</span>
      </button>
    </div>
  );
}

function HostManageVisual() {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 text-[#191817] border-2 border-[#191817] shadow-[3px_3px_0_#191817] text-left">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#ff5f56] uppercase mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] animate-pulse"></span>
            <span>LIVE QUIZ RUNNING</span>
          </div>
          <h4 className="text-2xl font-black text-[#191817] leading-none mb-1">
            asdf
          </h4>
          <span className="text-xs text-[#77736c] font-medium">
            1 Questions · 1 Students playing · PIN: <strong className="text-[#191817] font-mono">S4QQG</strong>
          </span>
        </div>

        <div className="border-2 border-[#191817] rounded-2xl p-2.5 bg-white shadow-[2px_2px_0_#191817] flex items-center gap-2 shrink-0">
          <Clock className="w-5 h-5 text-[#6c4de8]" />
          <div>
            <span className="block text-[8px] font-mono font-bold text-[#77736c] uppercase leading-none">
              REMAINING
            </span>
            <span className="font-mono font-black text-xl text-[#191817]">
              04:26
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#e5e0d8] my-3"></div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-bold text-[#191817] mb-1.5">
          <span>Quiz Submissions</span>
          <span className="text-xs text-[#77736c] font-medium">1 / 1 submitted (100%)</span>
        </div>
        <div className="w-full bg-[#f0ece1] rounded-full h-2.5 overflow-hidden">
          <div className="bg-[#6c4de8] h-full rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#77736c] uppercase mb-2">
          <Users className="w-3.5 h-3.5" />
          <span>STUDENT STATUS</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="bg-[#e6ffe6] border-2 border-[#00cc05] rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-[#08660a]">
            <span>adfasdf</span>
            <CheckCircle2 className="w-4 h-4 text-[#00cc05]" />
          </div>
        </div>
      </div>

      <div className="border-t border-[#e5e0d8] my-3"></div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => playSfx('warning')}
          className="border-2 border-[#ff0000] text-[#ff0000] bg-white hover:bg-[#ffebe8] px-4 py-2 rounded-xl text-xs font-black shadow-[2px_2px_0_#ff0000] flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span className="w-3 h-3 bg-[#ff0000] rounded-xs inline-block"></span>
          <span>End Quiz Early</span>
        </button>
      </div>
    </div>
  );
}

function HostResultsVisual() {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 text-[#191817] border-2 border-[#191817] shadow-[3px_3px_0_#191817] text-left">
      <div className="mb-3 text-center">
        <span className="font-hand text-sm font-bold text-[#6c4de8] block leading-none mb-1">
          quiz complete! ✦
        </span>
        <h4 className="text-2xl font-black text-[#191817] tracking-tight leading-tight">
          Leaderboard & Results
        </h4>
        <span className="text-xs text-[#77736c]">asdf · 1 Questions</span>
      </div>

      <div className="bg-[#fcfbf9] border border-[#e5e0d8] rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e5e0d8]">
          <div className="flex items-center gap-1.5 font-bold text-xs text-[#191817]">
            <Trophy className="w-4 h-4 text-[#6c4de8]" />
            <span>Final Standings</span>
          </div>
          <span className="text-[10px] text-[#77736c]">1 Total Student</span>
        </div>

        <div className="grid grid-cols-12 text-[10px] font-mono font-bold text-[#77736c] uppercase py-1 border-b border-[#191817]">
          <span className="col-span-2">RANK</span>
          <span className="col-span-5">STUDENT</span>
          <span className="col-span-2 text-center">SCORE</span>
          <span className="col-span-3 text-right">ACCURACY</span>
        </div>

        <div className="grid grid-cols-12 items-center text-xs py-2 bg-[#eeeafd]/40 px-1 rounded-lg mt-1">
          <div className="col-span-2 flex items-center">
            <span className="w-6 h-6 rounded-full bg-[#ffbd2e] text-[#946200] font-black text-xs flex items-center justify-center">
              🥇
            </span>
          </div>
          <div className="col-span-5 font-bold text-[#191817] truncate">
            adfasdf
          </div>
          <div className="col-span-2 text-center font-mono font-bold text-[#6c4de8]">
            0
          </div>
          <div className="col-span-3 text-right">
            <span className="bg-[#ffebe8] text-[#990000] border border-[#ff0000]/40 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
              0%
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => playSfx('button')}
          className="px-3 py-1.5 rounded-xl border-2 border-[#191817] text-xs font-bold bg-white text-[#191817] shadow-[1.5px_1.5px_0_#191817] cursor-pointer"
        >
          &larr; Back to Host Workspace
        </button>
        <button
          type="button"
          onClick={() => playSfx('button')}
          className="kz-btn-primary px-4 py-1.5 rounded-xl text-xs font-black shadow-[2px_2px_0_#191817] cursor-pointer"
        >
          Home &rarr;
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   PLAYER UI PLACEHOLDERS (Matching user screenshots exactly)
   ========================================================================= */

function PlayerJoinVisual() {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-3xl p-5 sm:p-6 text-[#191817] border-2 border-[#191817] shadow-[3.5px_3.5px_0_#191817] text-center">
      <span className="font-hand text-sm font-bold text-[#6c4de8] block leading-none mb-1">
        ready to play? ✦
      </span>

      <div className="w-11 h-11 rounded-2xl bg-[#eeeafd] border-2 border-[#191817] shadow-[2px_2px_0_#191817] flex items-center justify-center mx-auto my-2">
        <Gamepad2 className="w-6 h-6 text-[#6c4de8]" />
      </div>

      <h4 className="text-2xl font-black text-[#191817] tracking-tight leading-tight mb-1">
        Join Live Quiz
      </h4>
      <p className="text-xs text-[#77736c] max-w-xs mx-auto mb-4 leading-relaxed font-medium">
        Enter your nickname and the room Game PIN to join the session.
      </p>

      <div className="space-y-3 text-left mb-4">
        <div>
          <label className="block text-[10px] font-bold text-[#191817] uppercase tracking-wider mb-1">
            YOUR NICKNAME
          </label>
          <div className="w-full bg-white border-2 border-[#6c4de8] rounded-xl px-3 py-2 text-xs font-semibold text-[#191817]">
            Sam
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#191817] uppercase tracking-wider mb-1">
            GAME PIN
          </label>
          <div className="w-full bg-[#fcfbf9] border-2 border-[#d8d3ca] rounded-xl px-3 py-2 text-center font-mono font-bold text-sm tracking-widest text-[#77736c]">
            E.G.  FAY2A
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => playSfx('button')}
        className="kz-btn-primary w-full py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-[2.5px_2.5px_0_#191817] mb-3 cursor-pointer"
      >
        <span>Enter Waiting Room &rarr;</span>
      </button>

      <div className="text-[11px] text-[#77736c] pt-2 border-t border-[#f0ece1]">
        Hosting a quiz? <span className="text-[#6c4de8] font-bold underline cursor-pointer">Host Dashboard</span>
      </div>
    </div>
  );
}

function PlayerWaitVisual() {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-3xl p-5 sm:p-6 text-[#191817] border-2 border-[#191817] shadow-[3.5px_3.5px_0_#191817] text-center">
      <span className="font-hand text-sm font-bold text-[#6c4de8] block leading-none mb-1">
        you're in! wait for host to start ✦
      </span>

      <span className="text-[10px] font-mono font-bold tracking-widest text-[#77736c] uppercase block mt-2">
        BABY QUIZ
      </span>
      <h4 className="text-3xl font-black text-[#191817] tracking-tight leading-tight my-1">
        sunday
      </h4>

      <div className="inline-block bg-[#eeeafd] text-[#6c4de8] border border-[#c9bfff] font-mono text-xs font-bold px-3 py-1 rounded-xl my-2">
        Game PIN: P6N4Z
      </div>

      <div className="my-4">
        <div className="w-12 h-12 rounded-2xl bg-[#f7f5ef] border-2 border-[#191817] shadow-[2px_2px_0_#191817] flex items-center justify-center mx-auto mb-2">
          <div className="w-5 h-5 border-2 border-[#6c4de8] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-xs text-[#77736c] font-medium">
          Waiting for the host to launch the quiz...
        </p>
      </div>

      <div className="border-t border-[#e5e0d8] my-3"></div>

      <div className="text-left">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#77736c] uppercase mb-2">
          <Users className="w-3.5 h-3.5" />
          <span>PLAYERS IN ROOM (2)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#f7f5ef] border border-[#d8d3ca] text-xs font-bold px-3 py-1 rounded-xl text-[#191817]">
            asdf
          </span>
          <span className="bg-[#6c4de8] text-white border-2 border-[#191817] shadow-[1.5px_1.5px_0_#191817] text-xs font-black px-3 py-1 rounded-xl">
            sunday (You)
          </span>
        </div>
      </div>
    </div>
  );
}

function PlayerPlayVisual() {
  const [selectedOpt, setSelectedOpt] = useState('c');

  const handleSelect = (key) => {
    playSfx('choose-answer');
    setSelectedOpt(key);
  };

  return (
    <div className="space-y-3 text-[#191817]">
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border-2 border-[#191817] shadow-[2.5px_2.5px_0_#191817]">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
            <span className="font-black text-[#191817]">QUESTION 3</span>
            <span className="text-[#77736c]">/ 10</span>
          </div>

          <span className="text-[10px] font-mono font-bold text-[#77736c] uppercase hidden sm:inline">
            0 OF 10 ANSWERED
          </span>

          <div className="flex items-center gap-2">
            <div className="border-2 border-[#191817] rounded-xl px-2 py-0.5 flex items-center gap-1 font-mono font-bold text-xs bg-white shadow-[1px_1px_0_#191817]">
              <Clock className="w-3.5 h-3.5 text-[#6c4de8]" />
              <span>04:51</span>
            </div>

            <button
              type="button"
              onClick={() => playSfx('submitted')}
              className="kz-btn-primary px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Submit</span>
            </button>
          </div>
        </div>

        <div className="w-full bg-[#f0ece1] rounded-full h-1.5 overflow-hidden">
          <div className="bg-[#6c4de8] h-full rounded-full" style={{ width: '30%' }}></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#191817] shadow-[3.5px_3.5px_0_#191817]">
        <div className="bg-[#eeeafd] text-[#6c4de8] font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg border border-[#c9bfff] inline-block mb-2">
          Q3
        </div>

        <h4 className="text-lg sm:text-xl font-black text-[#191817] tracking-tight mb-4">
          Which sense is the least developed at birth?
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleSelect('a')}
            className={`rounded-2xl p-2.5 flex items-center gap-2.5 transition-all text-left cursor-pointer ${
              selectedOpt === 'a'
                ? 'bg-[#05cdff] text-white border-2 border-[#191817] shadow-[2px_2px_0_#191817]'
                : 'bg-[#e6f9ff] border-2 border-[#05cdff] text-[#034a6e]'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-[#05cdff] text-white flex items-center justify-center font-mono font-black text-xs shrink-0">
              A
            </div>
            <span className="text-xs font-bold">Hearing</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect('b')}
            className={`rounded-2xl p-2.5 flex items-center gap-2.5 transition-all text-left cursor-pointer ${
              selectedOpt === 'b'
                ? 'bg-[#ff0000] text-white border-2 border-[#191817] shadow-[2px_2px_0_#191817]'
                : 'bg-[#ffebe8] border-2 border-[#ff0000] text-[#990000]'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-[#ff0000] text-white flex items-center justify-center font-mono font-black text-xs shrink-0">
              B
            </div>
            <span className="text-xs font-bold">Touch</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect('c')}
            className={`rounded-2xl p-2.5 flex items-center gap-2.5 transition-all text-left cursor-pointer ${
              selectedOpt === 'c'
                ? 'bg-[#00cc05] text-white border-2 border-[#191817] shadow-[2.5px_2.5px_0_#191817]'
                : 'bg-[#e6ffe6] border-2 border-[#00ff04] text-[#08660a]'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-[#00cc05] text-white flex items-center justify-center font-mono font-black text-xs shrink-0">
              C
            </div>
            <span className="text-xs font-bold">Smell</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect('d')}
            className={`rounded-2xl p-2.5 flex items-center gap-2.5 transition-all text-left cursor-pointer ${
              selectedOpt === 'd'
                ? 'bg-[#8000ff] text-white border-2 border-[#191817] shadow-[2px_2px_0_#191817]'
                : 'bg-[#f3eaff] border-2 border-[#8000ff] text-[#4a0099]'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-[#8000ff] text-white flex items-center justify-center font-mono font-black text-xs shrink-0">
              D
            </div>
            <span className="text-xs font-bold">Sight</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-2 border-2 border-[#191817] shadow-[2px_2px_0_#191817] flex items-center justify-between gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => playSfx('backward-swish')}
          className="w-7 h-7 rounded-lg border border-[#191817] flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer"
        >
          &lt;
        </button>
        <div className="flex items-center gap-1 shrink-0">
          {[1, 2].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => playSfx('button')}
              className="w-6 h-6 rounded-full border border-[#d8d3ca] text-[10px] font-mono font-bold flex items-center justify-center text-[#77736c] cursor-pointer"
            >
              {num}
            </button>
          ))}
          <span className="w-7 h-7 rounded-full border-2 border-[#6c4de8] bg-[#eeeafd] text-xs font-mono font-black flex items-center justify-center text-[#6c4de8]">
            3
          </span>
          {[4, 5, 6].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => playSfx('button')}
              className="w-6 h-6 rounded-full border border-[#d8d3ca] text-[10px] font-mono font-bold flex items-center justify-center text-[#77736c] cursor-pointer"
            >
              {num}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => playSfx('forward-swish')}
          className="w-7 h-7 rounded-lg border border-[#191817] flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer"
        >
          &gt;
        </button>
        <button
          type="button"
          onClick={() => playSfx('submitted')}
          className="kz-btn-primary px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Send className="w-3 h-3" />
          <span>Submit Quiz &rarr;</span>
        </button>
      </div>
    </div>
  );
}

function PlayerResultsVisual() {
  const [showAnswers, setShowAnswers] = useState(true);

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl p-5 sm:p-6 text-[#191817] border-2 border-[#191817] shadow-[3.5px_3.5px_0_#191817] text-center">
      <span className="font-hand text-sm font-bold text-[#6c4de8] block leading-none mb-1">
        good practice! ✦
      </span>

      <span className="text-[10px] font-mono font-bold tracking-widest text-[#77736c] uppercase block mt-1">
        BABY QUIZ · RESULTS
      </span>

      <div className="font-mono font-black text-5xl sm:text-6xl text-[#6c4de8] tracking-tight my-1">
        0/10
      </div>
      <p className="text-xs text-[#77736c] font-medium mb-3">
        Nice work, <strong className="text-[#191817]">sunday</strong>! Here is how you did.
      </p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white border-2 border-[#191817] rounded-2xl p-2.5 shadow-[2px_2px_0_#191817]">
          <div className="text-lg font-mono font-black text-[#191817]">0%</div>
          <span className="text-[9px] font-mono font-bold text-[#77736c] uppercase block">
            ACCURACY
          </span>
        </div>

        <div className="bg-white border-2 border-[#191817] rounded-2xl p-2.5 shadow-[2px_2px_0_#191817]">
          <div className="text-lg font-mono font-black text-[#6c4de8]">1st</div>
          <span className="text-[9px] font-mono font-bold text-[#77736c] uppercase block">
            LEADERBOARD
          </span>
        </div>

        <div className="bg-white border-2 border-[#191817] rounded-2xl p-2.5 shadow-[2px_2px_0_#191817]">
          <div className="text-lg font-mono font-black text-[#00cc05]">0</div>
          <span className="text-[9px] font-mono font-bold text-[#77736c] uppercase block">
            CORRECT
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          playSfx('button');
          setShowAnswers(!showAnswers);
        }}
        className="inline-flex items-center gap-1 border-2 border-[#191817] rounded-xl px-3 py-1 text-xs font-bold bg-white shadow-[1.5px_1.5px_0_#191817] mb-3 cursor-pointer"
      >
        <span>{showAnswers ? 'Hide Answers' : 'Show Answers'}</span>
        <ChevronUp className={`w-3.5 h-3.5 transition-transform ${showAnswers ? '' : 'rotate-180'}`} />
      </button>

      {showAnswers && (
        <div className="text-left bg-[#fff8f7] border-2 border-[#ff0000] rounded-2xl p-3 shadow-[1.5px_1.5px_0_#ff0000]">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="text-xs font-black text-[#191817] leading-tight">
              Q1. At what age do most babies typically take their first independent steps?
            </span>
            <span className="bg-white border border-[#ff0000] text-[#ff0000] text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
              <span>⊗</span>
              <span>Incorrect</span>
            </span>
          </div>
          <div className="text-[11px] text-[#77736c] mb-0.5">
            Your answer: <span className="italic">No answer selected</span>
          </div>
          <div className="text-[11px] font-bold text-[#08660a]">
            Correct answer: C) 12 to 15 months
          </div>
        </div>
      )}
    </div>
  );
}
