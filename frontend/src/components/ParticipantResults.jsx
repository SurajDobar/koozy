import React, { useEffect, useState } from 'react';
import { Trophy, CheckCircle2, XCircle, ChevronDown, ChevronUp, ArrowRight, RotateCcw } from 'lucide-react';
import { fetchParticipantResult, submitQuizAnswers } from '../utils/api';
import { playSfx } from '../utils/sfx';

export default function ParticipantResults({ session, participant }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    async function loadResultData() {
      const pin = session.game_pin;
      const draftKey = `koozy_draft_${pin}_${participant?.id || 'guest'}`;
      if (!participant?.has_submitted && !participant?.submitted_at) {
        try {
          const raw = sessionStorage.getItem(draftKey);
          if (raw) {
            const draft = JSON.parse(raw);
            if (draft && Object.keys(draft).length > 0) {
              await submitQuizAnswers(pin, draft);
              sessionStorage.removeItem(draftKey);
            }
          }
        } catch (e) {
          console.error('Failed recovery auto-submit', e);
        }
      }
      try {
        const data = await fetchParticipantResult(pin);
        setResults(data);
        const correct = data?.correct_count || 0;
        const total = data?.total_questions || session.question_count || 1;
        const acc = data?.accuracy !== undefined ? data.accuracy : Math.round((correct / total) * 100);
        if (acc >= 50) {
          playSfx('koozy-win');
        } else {
          playSfx('koozy-loose');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadResultData();
  }, [session.game_pin, session.status, participant?.has_submitted, participant?.submitted_at, participant?.id]);

  const score = results?.score || participant?.score || 0;
  const correctCount = results?.correct_count || 0;
  const totalQuestions = results?.total_questions || session.question_count || 0;
  const accuracy = results?.accuracy !== undefined ? results.accuracy : totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const rank = results?.rank ? `${results.rank}${getOrdinal(results.rank)}` : '—';
  const answers = results?.answers || [];

  function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  function getHandNote(acc) {
    if (acc >= 90) return 'legendary score! ✦';
    if (acc >= 70) return 'not bad at all! ✦';
    if (acc >= 50) return 'solid effort! ✦';
    return 'good practice! ✦';
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 text-center">
      <div className="inline-block font-hand text-3xl text-[#6c4de8] -rotate-2 mb-2 select-none">
        {getHandNote(accuracy)}
      </div>

      <div className="kz-card p-8 md:p-12 mb-8 bg-[#fffdf7] border-2 border-[#191817] shadow-[5px_5px_0_#191817] rounded-3xl">
        <p className="text-xs uppercase font-bold tracking-widest text-[#77736c] mb-1">
          {session.quiz_title} · Results
        </p>

        <h1 className="text-6xl md:text-8xl font-black text-[#6c4de8] tracking-tight my-2 font-mono">
          {correctCount}/{totalQuestions}
        </h1>

        <p className="text-sm text-[#77736c] mb-8 font-medium">
          Nice work, <span className="font-bold text-[#191817]">{participant?.display_name}</span>! Here is how you did.
        </p>

        {/* 3 Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-4 bg-white border-2 border-[#191817] rounded-2xl shadow-[2px_2px_0_#191817]">
            <strong className="block text-2xl md:text-3xl font-black text-[#191817] font-mono">
              {accuracy}%
            </strong>
            <span className="text-[11px] font-bold text-[#77736c] uppercase tracking-wider">Accuracy</span>
          </div>

          <div className="p-4 bg-white border-2 border-[#191817] rounded-2xl shadow-[2px_2px_0_#191817]">
            <strong className="block text-2xl md:text-3xl font-black text-[#6c4de8] font-mono">
              {rank}
            </strong>
            <span className="text-[11px] font-bold text-[#77736c] uppercase tracking-wider">Leaderboard</span>
          </div>

          <div className="p-4 bg-white border-2 border-[#191817] rounded-2xl shadow-[2px_2px_0_#191817]">
            <strong className="block text-2xl md:text-3xl font-black text-[#00cc05] font-mono">
              {correctCount}
            </strong>
            <span className="text-[11px] font-bold text-[#77736c] uppercase tracking-wider">Correct</span>
          </div>
        </div>

        {/* Toggle Question Review */}
        {answers.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => {
                playSfx('button');
                setShowReview(!showReview);
              }}
              className="kz-btn-secondary px-5 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{showReview ? 'Hide Answers' : 'Review Your Answers'}</span>
              {showReview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showReview && (
              <div className="mt-6 text-left space-y-4 pt-4 border-t border-[#d8d3ca] max-h-[360px] overflow-y-auto pr-1">
                {answers.map((a, idx) => {
                  const isCorrect = a.is_correct;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        isCorrect
                          ? 'bg-[#e6ffe6] border-[#00ff04]'
                          : 'bg-[#ffebe8] border-[#ff0000]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-extrabold text-[#191817]">
                          Q{idx + 1}. {a.question_text}
                        </span>
                        {isCorrect ? (
                          <span className="text-xs font-bold text-[#08660a] flex items-center gap-1 shrink-0 bg-white px-2 py-0.5 rounded-md border border-[#a3ffa5]">
                            <CheckCircle2 size={13} /> Correct
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-[#990000] flex items-center gap-1 shrink-0 bg-white px-2 py-0.5 rounded-md border border-[#ffb3a8]">
                            <XCircle size={13} /> Incorrect
                          </span>
                        )}
                      </div>

                      <div className="text-xs space-y-1 mt-2 text-[#77736c]">
                        <p>
                          <span className="font-semibold text-[#191817]">Your answer:</span>{' '}
                          {a.selected_option
                            ? `${a.selected_option.toUpperCase()}) ${a['option_' + a.selected_option] || ''}`
                            : 'No answer selected'}
                        </p>
                        {!isCorrect && (
                          <p className="text-[#08660a] font-bold">
                            Correct answer: {a.correct_answer?.toUpperCase()}) {a['option_' + a.correct_answer?.toLowerCase()] || ''}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="pt-6 border-t border-[#d8d3ca] flex justify-center gap-4">
          <a
            href="/join/"
            className="kz-btn-primary px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer"
          >
            <span>Play another quiz</span>
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
