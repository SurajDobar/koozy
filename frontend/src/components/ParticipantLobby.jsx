import React from 'react';
import { Users, Loader2, Sparkles, Clock, UserCheck } from 'lucide-react';

export default function ParticipantLobby({ session, participant }) {
  const participants = session.participants || [];
  const count = session.participant_count || participants.length;
  const isPendingAdmission = participant?.is_admitted === false;

  if (isPendingAdmission) {
    return (
      <div className="max-w-md mx-auto p-6 md:p-10 text-center animate-fadeIn">
        <div className="inline-block font-hand text-3xl text-[#6c4de8] -rotate-2 mb-2 select-none">
          hang tight ✦
        </div>

        <div className="kz-card p-8 md:p-10 mb-6 bg-[#fffdf7] border-2 border-[#191817] shadow-[4px_4px_0_#191817] rounded-3xl">
          <div className="w-14 h-14 rounded-2xl bg-[#fff3cd] text-[#856404] border-2 border-[#191817] flex items-center justify-center shadow-[3px_3px_0_#191817] mx-auto mb-4 animate-bounce">
            <Clock size={28} />
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-[#191817] mb-2">
            Waiting for the host to let you in.
          </h2>

          <p className="text-sm text-[#77736c] mb-6">
            The quiz has already started. The host has been notified that you're waiting and will admit you in a moment.
          </p>

          <div className="p-3.5 bg-[#eeeafd] border border-[#c9bfff] rounded-xl text-xs font-bold text-[#6c4de8] flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span>Connecting as <strong className="text-[#191817]">{participant?.display_name}</strong></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10 text-center">
      <div className="inline-block font-hand text-3xl text-[#6c4de8] -rotate-2 mb-2 select-none">
        you're in! wait for host to start ✦
      </div>

      <div className="kz-card p-8 md:p-12 mb-6 bg-[#fffdf7] border-2 border-[#191817] shadow-[4px_4px_0_#191817] rounded-3xl">
        <p className="text-xs uppercase font-bold tracking-widest text-[#77736c] mb-1">
          {session.quiz_title || 'Live Quiz'}
        </p>

        <h1 className="text-4xl md:text-5xl font-black text-[#191817] mb-2 tracking-tight">
          {participant?.display_name || 'Player'}
        </h1>

        <div className="inline-flex items-center gap-2 bg-[#eeeafd] border border-[#c9bfff] px-4 py-1.5 rounded-xl text-sm font-bold text-[#6c4de8] my-4">
          <span>Game PIN:</span>
          <span className="font-mono tracking-widest font-extrabold">{session.game_pin}</span>
        </div>

        <div className="my-8 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#eeeafd] text-[#6c4de8] border-2 border-[#191817] flex items-center justify-center shadow-[3px_3px_0_#191817] animate-pulse">
            <Loader2 size={26} className="animate-spin" />
          </div>
          <p className="text-[#77736c] text-sm font-medium">
            Waiting for the host to launch the quiz...
          </p>
        </div>

        <div className="pt-6 border-t border-[#d8d3ca]">
          <div className="flex items-center justify-center gap-2 mb-4 text-xs font-bold text-[#77736c] uppercase tracking-wider">
            <Users size={15} />
            <span>Players in Room ({count})</span>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-h-[160px] overflow-y-auto p-1">
            {participants.map((p) => {
              const isMe = p.id === participant?.id || p.display_name === participant?.display_name;
              return (
                <div
                  key={p.id}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isMe
                      ? 'bg-[#6c4de8] text-white border-2 border-[#191817] shadow-[2px_2px_0_#191817]'
                      : 'bg-white border-1.5 border-[#d8d3ca] text-[#191817]'
                  }`}
                >
                  {p.display_name} {isMe && '(You)'}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
