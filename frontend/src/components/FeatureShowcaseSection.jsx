import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Download, Upload, Plus, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { playSfx } from '../utils/sfx';

export default function FeatureShowcaseSection() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [activeCard, setActiveCard] = useState(0);
  const [videoAHovered, setVideoAHovered] = useState(false);
  const [videoBHovered, setVideoBHovered] = useState(false);

  useEffect(() => {
    let animationFrameId = null;

    const updateTransform = () => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;

      const rect = container.getBoundingClientRect();
      const scrollableDistance = container.offsetHeight - window.innerHeight;

      if (scrollableDistance <= 0) return;

      // Calculate progress from 0 to 1
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));

      // Calculate translation
      const viewportWidth = container.clientWidth;
      const maxTranslate = Math.max(0, track.scrollWidth - viewportWidth + 48);
      const currentTranslate = progress * maxTranslate;

      track.style.transform = `translate3d(-${currentTranslate.toFixed(1)}px, 0, 0)`;

      // Active card index
      const cardIdx = Math.min(2, Math.floor(progress * 2.99));
      setActiveCard(cardIdx);
    };

    const onScroll = () => {
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(() => {
          updateTransform();
          animationFrameId = null;
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateTransform();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const scrollToCard = (index) => {
    playSfx('button');
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const containerTop = window.scrollY + rect.top;
    const scrollableDistance = container.offsetHeight - window.innerHeight;
    const targetScroll = containerTop + (index / 2) * scrollableDistance;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  const handleDownloadSample = () => {
    playSfx('button');
    const sampleQuiz = {
      title: 'Space & Astronomy Blitz',
      category: 'Science & Trivia',
      difficulty: 'Medium',
      time_limit: 300,
      questions: [
        {
          question: 'What is the largest planet in our solar system?',
          options: ['Earth', 'Jupiter', 'Saturn', 'Neptune'],
          correct_answer: 'Jupiter'
        },
        {
          question: 'Which galaxy is closest to the Milky Way?',
          options: ['Andromeda', 'Triangulum', 'Sombrero', 'Whirlpool'],
          correct_answer: 'Andromeda'
        },
        {
          question: 'What is the hottest planet in our solar system?',
          options: ['Mercury', 'Venus', 'Mars', 'Jupiter'],
          correct_answer: 'Venus'
        }
      ]
    };
    const blob = new Blob([JSON.stringify(sampleQuiz, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'space_and_astronomy_blitz.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      ref={containerRef}
      id="features-showcase"
      className="relative border-t border-[#d8d3ca]"
      style={{ height: '300vh' }}
    >
      {/* 
        Pinned Viewport Container:
        Positioned strictly below the sticky site navbar (top-16 / top-[68px])
        with calculated height so the section header is 100% visible and never hidden behind the navbar.
      */}
      <div className="sticky top-16 sm:top-[68px] h-[calc(100dvh-4.25rem)] sm:h-[calc(100dvh-4.5rem)] w-full overflow-hidden flex flex-col justify-between py-2 sm:py-3 md:py-4 bg-[#f7f5ef] z-20">
        {/* Header Bar */}
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left z-20 shrink-0 mb-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#eeeafd] border border-[#c9bfff] rounded-full text-[10px] sm:text-[11px] font-mono font-bold text-[#6c4de8] mb-1">
              <span>✦</span>
              <span>CREATOR SHOWCASE</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#191817] tracking-tight leading-tight">
              Powerful Features for Quiz Creators
            </h2>
          </div>

          {/* Interactive Card Selection Navigation */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-white border-2 border-[#191817] rounded-xl shadow-[2px_2px_0_#191817]">
              {[
                { letter: 'A', label: 'AI Generator' },
                { letter: 'B', label: 'Bring Your AI' },
                { letter: 'C', label: 'Import / Export' },
              ].map((item, idx) => (
                <button
                  key={item.letter}
                  type="button"
                  onClick={() => scrollToCard(idx)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCard === idx
                      ? 'bg-[#191817] text-white shadow-[1px_1px_0_#191817]'
                      : 'text-[#77736c] hover:text-[#191817] hover:bg-[#f7f5ef]'
                  }`}
                  aria-label={`Scroll to feature ${item.letter}: ${item.label}`}
                >
                  <span className="font-mono font-black">{item.letter}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Arrow Jump Buttons */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollToCard(Math.max(0, activeCard - 1))}
                disabled={activeCard === 0}
                aria-label="Previous feature card"
                className="p-1.5 rounded-lg bg-white border-2 border-[#191817] shadow-[2px_2px_0_#191817] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f7f5ef] cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scrollToCard(Math.min(2, activeCard + 1))}
                disabled={activeCard === 2}
                aria-label="Next feature card"
                className="p-1.5 rounded-lg bg-white border-2 border-[#191817] shadow-[2px_2px_0_#191817] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f7f5ef] cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Track Container */}
        <div className="relative w-full overflow-hidden my-auto py-1 sm:py-2 flex items-center">
          <div
            ref={trackRef}
            className="flex items-stretch gap-8 sm:gap-12 md:gap-16 will-change-transform pl-4 sm:pl-8 md:pl-16 lg:pl-24"
            style={{ transform: 'translate3d(0px, 0px, 0px)' }}
          >
            {/* ── CARD A: AI QUIZ GENERATION ──────────────────────────── */}
            <div className="w-[88vw] sm:w-[680px] md:w-[780px] lg:w-[860px] max-w-[880px] shrink-0 kz-card-tactile bg-[#e6f9ff] p-5 sm:p-7 md:p-8 border-2 border-[#191817] shadow-[5px_5px_0_#191817] rounded-3xl flex flex-col justify-between max-h-[72dvh] sm:max-h-none overflow-y-auto sm:overflow-visible">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 items-center">
                {/* Left Description Column */}
                <div className="md:col-span-5 flex flex-col justify-center text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#05cdff] text-white flex items-center justify-center font-mono font-black text-sm sm:text-base border-2 border-[#191817] shadow-[1.5px_1.5px_0_#191817] shrink-0">
                      A
                    </div>
                    <span className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-[#191817] text-[#034a6e]">
                      Step 01 ✦ AI GENERATOR
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-[#191817] tracking-tight mb-2 leading-tight">
                    AI Quiz Generation
                  </h3>
                  <p className="text-xs sm:text-sm text-[#034a6e] font-medium leading-relaxed mb-4">
                    Type any topic. Gemini writes 4-choice questions in 5 seconds. Edit anything before you start the game.
                  </p>

                  <div className="mb-5">
                    <span className="inline-block text-[11px] font-mono font-bold text-[#034a6e] bg-white/70 px-2.5 py-1 rounded-lg border border-[#05cdff]">
                      ✦ Free daily generation quotas
                    </span>
                  </div>

                  <div>
                    <a
                      href="/ai-quiz-maker/"
                      className="kz-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-[2px_2px_0_#191817]"
                    >
                      <span>Try AI Generator</span>
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </div>

                {/* Right Video Mockup Column */}
                <div className="md:col-span-7">
                  <div className="kz-card-tactile bg-white p-2 sm:p-2.5 border-2 border-[#191817] shadow-[3.5px_3.5px_0_#191817] rounded-2xl text-left">
                    {/* Window Header */}
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#d8d3ca]">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#191817]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#191817]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#191817]"></span>
                        <span className="ml-1.5 font-mono text-[10px] sm:text-[11px] font-bold text-[#191817] truncate">
                          ai-quiz-generation.mp4
                        </span>
                      </div>
                      <span className="shrink-0 text-[9px] font-mono font-bold uppercase tracking-wider text-[#034a6e] bg-[#e6f9ff] px-2 py-0.5 rounded-full border border-[#05cdff]">
                        Gemini AI
                      </span>
                    </div>

                    {/* 
                      Video: No controls during normal autoplay.
                      Controls appear on hover for scrubber/pause control.
                    */}
                    <div
                      className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#191817] bg-[#191817]"
                      onMouseEnter={() => setVideoAHovered(true)}
                      onMouseLeave={() => setVideoAHovered(false)}
                    >
                      <video
                        src="/videos/ai-quiz-generation.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        controls={videoAHovered}
                        className="w-full h-full object-cover block"
                        aria-label="Demonstration of AI quiz generation in Koozy"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CARD B: BRING YOUR OWN AI ───────────────────────────── */}
            <div className="w-[88vw] sm:w-[680px] md:w-[780px] lg:w-[860px] max-w-[880px] shrink-0 kz-card-tactile bg-[#ffebe8] p-5 sm:p-7 md:p-8 border-2 border-[#191817] shadow-[5px_5px_0_#191817] rounded-3xl flex flex-col justify-between max-h-[72dvh] sm:max-h-none overflow-y-auto sm:overflow-visible">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 items-center">
                {/* Left Description Column */}
                <div className="md:col-span-5 flex flex-col justify-center text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#ff0000] text-white flex items-center justify-center font-mono font-black text-sm sm:text-base border-2 border-[#191817] shadow-[1.5px_1.5px_0_#191817] shrink-0">
                      B
                    </div>
                    <span className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-[#191817] text-[#990000]">
                      Step 02 ✦ ANY LLM
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-[#191817] tracking-tight mb-2 leading-tight">
                    Bring Your Own AI
                  </h3>
                  <p className="text-xs sm:text-sm text-[#990000] font-medium leading-relaxed mb-4">
                    Use ChatGPT, Claude, or DeepSeek. Copy our prompt, paste your notes, and drop questions straight into Koozy.
                  </p>

                  <div className="mb-5">
                    <span className="inline-block text-[11px] font-mono font-bold text-[#990000] bg-white/70 px-2.5 py-1 rounded-lg border border-[#ff0000]">
                      ✦ Works with notes, PDFs & slides
                    </span>
                  </div>

                  <div>
                    <a
                      href="/host/quizzes/create/"
                      className="kz-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-[2px_2px_0_#191817]"
                    >
                      <span>Host with Your AI</span>
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </div>

                {/* Right Video Mockup Column */}
                <div className="md:col-span-7">
                  <div className="kz-card-tactile bg-white p-2 sm:p-2.5 border-2 border-[#191817] shadow-[3.5px_3.5px_0_#191817] rounded-2xl text-left">
                    {/* Window Header */}
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#d8d3ca]">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#191817]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#191817]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#191817]"></span>
                        <span className="ml-1.5 font-mono text-[10px] sm:text-[11px] font-bold text-[#191817] truncate">
                          your-quiz-generation.mp4
                        </span>
                      </div>
                      <span className="shrink-0 text-[9px] font-mono font-bold uppercase tracking-wider text-[#990000] bg-[#ffebe8] px-2 py-0.5 rounded-full border border-[#ff0000]">
                        ChatGPT / Claude / DeepSeek
                      </span>
                    </div>

                    {/* 
                      Video: No controls during normal autoplay.
                      Controls appear on hover for scrubber/pause control.
                    */}
                    <div
                      className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#191817] bg-[#191817]"
                      onMouseEnter={() => setVideoBHovered(true)}
                      onMouseLeave={() => setVideoBHovered(false)}
                    >
                      <video
                        src="/videos/your-quiz-generation.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        controls={videoBHovered}
                        className="w-full h-full object-cover block"
                        aria-label="Demonstration of bringing your own AI into Koozy"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CARD C: IMPORT / EXPORT QUIZZES (Real UI Mockup) ─────── */}
            <div className="w-[88vw] sm:w-[680px] md:w-[780px] lg:w-[860px] max-w-[880px] shrink-0 kz-card-tactile bg-[#e6ffe6] p-5 sm:p-7 md:p-8 border-2 border-[#191817] shadow-[5px_5px_0_#191817] rounded-3xl flex flex-col justify-between max-h-[72dvh] sm:max-h-none overflow-y-auto sm:overflow-visible">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 items-center">
                {/* Left Description Column */}
                <div className="md:col-span-5 flex flex-col justify-center text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#00cc05] text-[#191817] flex items-center justify-center font-mono font-black text-sm sm:text-base border-2 border-[#191817] shadow-[1.5px_1.5px_0_#191817] shrink-0">
                      C
                    </div>
                    <span className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-[#191817] text-[#08660a]">
                      Step 03 ✦ IMPORT & EXPORT
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-[#191817] tracking-tight mb-2 leading-tight">
                    Import & Export Quizzes
                  </h3>
                  <p className="text-xs sm:text-sm text-[#08660a] font-medium leading-relaxed mb-3">
                    Upload any .json quiz to host right away, or download backups of your questions anytime with one click.
                  </p>

                  {/* Bonus Callout: Background Music (BGM) */}
                  <div className="p-2 sm:p-2.5 bg-white/90 border-2 border-[#191817] rounded-xl shadow-[1.5px_1.5px_0_#191817] flex items-center gap-2 text-xs text-[#191817] mb-4">
                    <span className="text-base shrink-0">🎵</span>
                    <span className="text-[11px] sm:text-xs text-[#191817]">
                      <strong>Bonus:</strong> In-game background music (BGM) included to keep game nights energetic.
                    </span>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleDownloadSample}
                      className="kz-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-[2px_2px_0_#191817] cursor-pointer"
                    >
                      <Download size={16} />
                      <span>Download Sample Quiz (.json)</span>
                    </button>
                  </div>
                </div>

                {/* Right Static Visual: Real Koozy Host UI Mockup */}
                <div className="md:col-span-7">
                  <div className="kz-card-tactile bg-white p-2.5 sm:p-3 border-2 border-[#191817] shadow-[3.5px_3.5px_0_#191817] rounded-2xl text-left">
                    {/* Window Header */}
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#d8d3ca]">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#191817]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#191817]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#191817]"></span>
                        <span className="ml-1.5 font-mono text-[10px] sm:text-[11px] font-bold text-[#191817] truncate">
                          koozy.live/host/quizzes/
                        </span>
                      </div>
                      <span className="shrink-0 text-[9px] font-mono font-bold uppercase tracking-wider text-[#08660a] bg-[#e6ffe6] px-2 py-0.5 rounded-full border border-[#00cc05]">
                        Host Studio
                      </span>
                    </div>

                    {/* Real Koozy Dashboard Interface Mockup */}
                    <div className="bg-[#f7f5ef] border-2 border-[#191817] rounded-xl p-3 sm:p-4 space-y-3">
                      {/* Top Action Bar matching Koozy Host View */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDownloadSample}
                            className="bg-white border-2 border-[#191817] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0_#191817] hover:bg-[#e6ffe6] cursor-pointer"
                          >
                            <Upload size={13} className="text-[#6c4de8]" />
                            <span>Import JSON</span>
                          </button>
                          <a
                            href="/host/quizzes/create/"
                            className="bg-white border-2 border-[#191817] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0_#191817] hover:bg-[#fffdf7]"
                          >
                            <Plus size={13} />
                            <span>+ Create Quiz</span>
                          </a>
                        </div>
                        <span className="hidden sm:inline-block font-mono text-[10px] font-bold text-[#77736c]">
                          1 Quiz Ready
                        </span>
                      </div>

                      {/* Real Koozy Quiz Card */}
                      <div className="bg-white border-2 border-[#191817] rounded-xl p-3.5 shadow-[3px_3px_0_#191817] flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="bg-[#eeeafd] text-[#6c4de8] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#c9bfff]">
                              Science & Trivia
                            </span>
                            <span className="text-[10px] font-semibold text-[#77736c]">
                              Medium · 300s
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-black text-[#191817] leading-tight">
                            Space & Astronomy Blitz
                          </h4>
                          <p className="text-[11px] text-[#77736c] font-medium mt-0.5 mb-3">
                            10 Questions · 4 choices each · Ready to play
                          </p>
                        </div>

                        {/* Card Buttons: Host Live + Real Download .json button */}
                        <div className="pt-2.5 border-t border-[#d8d3ca] flex items-center justify-between gap-2">
                          <a
                            href="/host/quizzes/"
                            className="kz-btn-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-[1.5px_1.5px_0_#191817]"
                          >
                            <Play size={11} fill="currentColor" />
                            <span>Host Live →</span>
                          </a>

                          <button
                            type="button"
                            onClick={handleDownloadSample}
                            className="kz-btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-[1.5px_1.5px_0_#191817] hover:bg-[#e6ffe6] cursor-pointer"
                            title="Download quiz JSON file"
                          >
                            <Download size={13} className="text-[#08660a]" />
                            <span>Download .json</span>
                          </button>
                        </div>
                      </div>

                      {/* Footnote matching real product */}
                      <div className="flex items-center justify-between text-[10px] text-[#77736c] font-mono px-1">
                        <span>✓ Click "Download .json" to save offline</span>
                        <span>Full Data Portability</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trailing Space */}
            <div className="w-12 sm:w-20 md:w-32 shrink-0" aria-hidden="true" />
          </div>
        </div>

        {/* Footer Navigation Cue / Progress Bar */}
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 flex items-center justify-between text-xs font-bold text-[#77736c] z-20 shrink-0">
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToCard(idx)}
                aria-label={`Go to feature card ${idx + 1}`}
                className={`h-2 sm:h-2.5 rounded-full transition-all cursor-pointer ${
                  activeCard === idx
                    ? 'w-8 bg-[#6c4de8]'
                    : 'w-2.5 bg-[#d8d3ca] hover:bg-[#77736c]'
                }`}
              />
            ))}
          </div>

          <div className="font-hand text-sm sm:text-base text-[#191817]">
            {activeCard < 2 ? (
              <span>scroll down to see more features <span className="text-[#6c4de8]">→</span></span>
            ) : (
              <span>all 3 features unlocked ✦ keep scrolling <span className="text-[#6c4de8]">↓</span></span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
