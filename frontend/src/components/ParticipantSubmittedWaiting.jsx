import React from 'react';
import { Clock, CheckCircle2, Loader2 } from 'lucide-react';

export default function ParticipantSubmittedWaiting({ session, participant }) {
  const secondsRemaining = session?.seconds_remaining;

  return (
    <div className="max-w-xl mx-auto p-6 text-center animate-fadeIn my-auto">
      <div className="kz-card p-8 md:p-10 bg-[#fffdf7] border-2 border-[#191817] shadow-[5px_5px_0_#191817] rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-[#e6ffe6] text-[#08660a] border-2 border-[#191817] shadow-[2px_2px_0_#191817] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>

        <div className="inline-block font-hand text-2xl text-[#6c4de8] -rotate-1 mb-1 select-none">
          answers submitted! ✦
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-[#191817] mb-2">
          Nice job, {participant?.display_name || 'Player'}!
        </h2>

        <p className="text-sm text-[#77736c] mb-6 font-medium max-w-sm mx-auto">
          Your answers are saved. Results, answer explanations, and final leaderboard standings will appear as soon as the quiz ends.
        </p>

        {secondsRemaining !== undefined && secondsRemaining > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f7f5ef] border border-[#d8d3ca] rounded-xl text-xs font-bold text-[#191817] mb-6">
            <Clock size={15} className="text-[#6c4de8]" />
            <span>Time remaining in quiz: {secondsRemaining}s</span>
          </div>
        )}

        <div className="p-4 bg-white border-2 border-[#d8d3ca] rounded-2xl flex items-center justify-center gap-3">
          <Loader2 size={18} className="animate-spin text-[#6c4de8]" />
          <span className="text-xs font-bold text-[#77736c]">
            Waiting for teacher or timer to end session...
          </span>
        </div>
      </div>
    </div>
  );
}
