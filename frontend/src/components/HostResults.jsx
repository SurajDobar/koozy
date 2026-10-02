import React, { useEffect, useState } from 'react';
import { Trophy, Medal, ArrowRight, RotateCcw, Award } from 'lucide-react';
import { fetchHostResult } from '../utils/api';
import { playSfx } from '../utils/sfx';

export default function HostResults({ session }) {
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHostResult(session.game_pin)
      .then((data) => {
        setResultData(data);
        setLoading(false);
        playSfx('win');
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [session.game_pin]);

  const leaderboard = resultData?.leaderboard || [];

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <div className="text-center mb-8">
        <div className="inline-block font-hand text-3xl text-[#6c4de8] -rotate-2 mb-2 select-none">
          quiz complete! ✦
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#191817] tracking-tight">
          Leaderboard & Results
        </h1>
        <p className="text-[#77736c] text-sm mt-1">
          {session.quiz_title} · {session.question_count} Questions
        </p>
      </div>

      <div className="kz-card p-6 md:p-8 mb-8 bg-[#fffdf7] border-2 border-[#191817] shadow-[5px_5px_0_#191817] rounded-3xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#d8d3ca]">
          <h2 className="text-xl font-bold text-[#191817] flex items-center gap-2">
            <Trophy size={22} className="text-[#6c4de8]" />
            <span>Final Standings</span>
          </h2>
          <span className="text-xs font-semibold text-[#77736c]">
            {leaderboard.length} Total Student{leaderboard.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#77736c] font-bold">Loading final scores...</div>
        ) : leaderboard.length === 0 ? (
          <div className="py-12 text-center text-[#77736c]">No participant answers recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#191817] text-xs font-black uppercase tracking-wider text-[#77736c]">
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-right">Score</th>
                  <th className="py-3 px-4 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebe7df]">
                {leaderboard.map((player, idx) => {
                  const rank = idx + 1;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;

                  return (
                    <tr
                      key={player.id}
                      className={`hover:bg-[#f7f5ef] transition-colors ${
                        isTop1
                          ? 'bg-[#eeeafd]/50 font-bold'
                          : ''
                      }`}
                    >
                      <td className="py-4 px-4 text-center">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#fde047] text-[#854d0e] border-1.5 border-[#eab308] font-black text-sm shadow-xs">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#e2e8f0] text-[#334155] border-1.5 border-[#cbd5e1] font-black text-sm shadow-xs">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#fed7aa] text-[#9a3412] border-1.5 border-[#fdba74] font-black text-sm shadow-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="font-bold text-[#77736c] text-sm">{rank}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#191817] text-base">
                        {player.display_name}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-black text-[#6c4de8] text-base">
                        {player.score.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-[#191817] text-sm">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            player.accuracy >= 80
                              ? 'bg-[#e6ffe6] text-[#08660a] border border-[#a3ffa5]'
                              : player.accuracy >= 50
                              ? 'bg-[#fef08a] text-[#854d0e] border border-[#fde047]'
                              : 'bg-[#ffebe8] text-[#990000] border border-[#ffb3a8]'
                          }`}
                        >
                          {player.accuracy}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[#d8d3ca] flex flex-wrap justify-between items-center gap-4">
          <a
            href="/host/quizzes/"
            className="kz-btn-secondary px-6 py-2.5 rounded-xl font-bold text-sm"
          >
            ← Back to Host Workspace
          </a>
          <a
            href="/"
            className="kz-btn-primary px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5"
          >
            <span>Home</span>
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
