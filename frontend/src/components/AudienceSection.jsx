import React, { useState } from 'react';
import { playSfx } from '../utils/sfx';

export default function AudienceSection() {
  const [selectedAudience, setSelectedAudience] = useState('classroom');

  const audiences = [
    {
      id: 'classroom',
      emoji: '🏫',
      label: 'Classrooms',
      heading: 'Engage every student right from their own desk.',
      explanation:
        'Review unit topics, run quick bell-ringer quizzes, and check comprehension in real time. Questions and all four choices appear directly on student devices—no projector or classroom app download needed.',
      highlights: ['No app download required', 'Device-native questions', 'Instant automatic grading']
    },
    {
      id: 'teams',
      emoji: '👥',
      label: 'Teams',
      heading: 'Energize remote and hybrid team meetings.',
      explanation:
        'Boost engagement during all-hands, sprint retros, or team trivia icebreakers. Fast 5-letter PIN joining gets remote coworkers playing across Zoom, Slack, or Google Meet with zero friction.',
      highlights: ['Works seamlessly on Zoom & Slack', '3-second PIN entry', 'Live leaderboard podium']
    },
    {
      id: 'events',
      emoji: '🎉',
      label: 'Events',
      heading: 'Turn any gathering into an electric live game show.',
      explanation:
        'From community meetups to conferences and pub trivia, anyone can join from their phone browser in seconds. Synchronized global countdowns and real-time scores keep crowd energy soaring.',
      highlights: ['Zero setup friction', 'Synchronized live countdown', 'Large crowd ready']
    },
    {
      id: 'friends',
      emoji: '🏠',
      label: 'Friends & Family',
      heading: 'Instant game nights for living rooms and video calls.',
      explanation:
        'Host custom trivia for birthday parties, holiday gatherings, or casual weekend showdowns. Because players join 100% as guests, everyone from techies to grandparents can play without making accounts.',
      highlights: ['100% free for guests', 'Works on any smartphone', 'No account registration']
    },
    {
      id: 'workshops',
      emoji: '💼',
      label: 'Workshops & Training',
      heading: 'Interactive knowledge checks for corporate training.',
      explanation:
        'Keep professional attendees alert and verify retention throughout bootcamps, workshops, and onboarding sessions with instant multi-choice questions and live accuracy feedback.',
      highlights: ['Active participant engagement', 'Real-time accuracy stats', 'Exportable question banks']
    }
  ];

  const current = audiences.find((a) => a.id === selectedAudience) || audiences[0];

  const handleSelect = (id) => {
    playSfx('button');
    setSelectedAudience(id);
  };

  return (
    <section className="py-12 md:py-16 border-t border-[#d8d3ca]">
      <div className="kz-card-tactile bg-[#fffdf7] p-7 sm:p-10 border-2 border-[#191817] shadow-[4px_4px_0_#191817] rounded-3xl text-center">
        <div className="mb-6">
          <span className="font-hand text-base sm:text-lg font-bold text-[#6c4de8] block mb-1">
            built for more than classrooms ✦
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-[#191817] tracking-tight">
            Made for wherever people gather.
          </h3>
        </div>

        {/* Interactive Audience Buttons */}
        <div
          className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-3.5 mb-8"
          role="tablist"
          aria-label="Target audience categories"
        >
          {audiences.map((aud) => {
            const isSelected = aud.id === selectedAudience;
            return (
              <button
                key={aud.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleSelect(aud.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#6c4de8] text-white border-2 border-[#191817] shadow-[2.5px_2.5px_0_#191817] scale-[1.03]'
                    : 'bg-white text-[#191817] border-2 border-[#191817] shadow-[2px_2px_0_#191817] hover:bg-[#eeeafd] hover:text-[#6c4de8]'
                }`}
              >
                <span>{aud.emoji}</span>
                <span>{aud.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Heading and Explanation for Selected Audience */}
        <div className="max-w-2xl mx-auto transition-all duration-300">
          <h4 className="text-xl sm:text-2xl font-black text-[#191817] mb-2.5">
            {current.heading}
          </h4>
          <p className="text-sm sm:text-base text-[#77736c] font-medium leading-relaxed mb-5">
            {current.explanation}
          </p>

          <div className="flex flex-wrap justify-center items-center gap-2 pt-2">
            {current.highlights.map((item, idx) => (
              <span
                key={idx}
                className="text-[11px] sm:text-xs font-mono font-bold px-2.5 py-1 bg-white border border-[#191817] rounded-lg text-[#191817] shadow-[1px_1px_0_#191817]"
              >
                ✓ {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
