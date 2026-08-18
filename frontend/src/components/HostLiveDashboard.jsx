import React, { useState, useEffect } from 'react';
import { Clock, Users, CheckCircle2, Square, UserCheck, AlertTriangle } from 'lucide-react';
import { endQuiz, admitParticipant } from '../utils/api';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function HostLiveDashboard({ session, onEndSuccess }) {
  const [secondsRemaining, setSecondsRemaining] = useState(session.seconds_remaining || 0);
  const [ending, setEnding] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [admittingId, setAdmittingId] = useState(null);

  useEffect(() => {
    setSecondsRemaining(session.seconds_remaining || 0);
  }, [session.seconds_remaining]);

  useEffect(() => {
    if (session.status !== 'ACTIVE' || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session.status]);

  const confirmEndQuiz = async () => {
    setEnding(true);
    try {
      const res = await endQuiz(session.game_pin);
      setShowConfirmEnd(false);
      if (onEndSuccess) onEndSuccess(res);
    } catch (err) {
      console.error(err);
      setEnding(false);
    }
  };

  const handleAdmit = async (id) => {
    setAdmittingId(id);
    try {
      await admitParticipant(session.game_pin, id);
      setAdmittingId(null);
    } catch (err) {
      console.error(err);
      setAdmittingId(null);
    }
  };

  const participants = session.participants || [];
  const pendingParticipants = session.pending_participants || [];
  const submissionsCount = session.submissions_count || 0;
  const participantCount = session.participant_count || participants.length;
  const isTimeLow = secondsRemaining <= 30;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <div className="kz-card p-6 md:p-8 mb-6 bg-[#fffdf7] border-2 border-[#191817] shadow-[4px_4px_0_#191817] rounded-3xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#d8d3ca]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff0000] animate-ping"></span>
              <span className="text-xs uppercase font-bold tracking-widest text-[#77736c]">
                Live Quiz Running
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#191817] mt-1">
              {session.quiz_title}
            </h2>
            <p className="text-sm text-[#77736c]">
              {session.question_count} Questions · {participantCount} Students playing · PIN: <span className="font-mono font-bold text-[#191817]">{session.game_pin}</span>
            </p>
          </div>

          {/* Global Timer Ring */}
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all ${isTimeLow ? 'bg-[#fee2e2] border-[#ff0000] text-[#ff0000] animate-bounce' : 'bg-white border-[#191817] text-[#191817]'}`}>
            <Clock size={22} className={isTimeLow ? 'text-[#ff0000]' : 'text-[#6c4de8]'} />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Remaining</p>
              <p className="font-mono text-2xl md:text-3xl font-black leading-none">
                {formatTime(secondsRemaining)}
              </p>
            </div>
          </div>
        </div>

        {/* Live Progress Bar */}
        <div className="my-6">
          <div className="flex justify-between items-center text-xs font-bold text-[#77736c] mb-1.5">
            <span>Quiz Submissions</span>
            <span>{submissionsCount} / {participantCount} submitted ({participantCount > 0 ? Math.round(submissionsCount / participantCount * 100) : 0}%)</span>
          </div>
          <div className="w-full h-3 bg-[#ebe7df] rounded-full overflow-hidden border border-[#d8d3ca]">
            <div
              className="h-full bg-[#6c4de8] transition-all duration-500 rounded-full"
              style={{ width: `${participantCount > 0 ? (submissionsCount / participantCount) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Pending Late Joiners (Section 10 & 11) */}
        {pendingParticipants.length > 0 && (
          <div className="mb-6 p-4 bg-[#fff3cd] border-2 border-[#856404] rounded-2xl text-left animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#856404] mb-2">
              <UserCheck size={16} />
              <span>Late Joiners Waiting for Admission ({pendingParticipants.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pendingParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#856404] rounded-xl text-xs font-bold"
                >
                  <span>{p.display_name}</span>
                  <button
                    onClick={() => handleAdmit(p.id)}
                    disabled={admittingId === p.id}
                    className="bg-[#6c4de8] text-white px-2.5 py-0.5 rounded-lg text-xs font-bold hover:bg-[#5838d6] cursor-pointer"
                  >
                    {admittingId === p.id ? 'Admitting...' : 'Admit →'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Participants Roster */}
        <div className="mt-6">
          <h3 className="text-sm uppercase font-bold tracking-wider text-[#77736c] mb-3 flex items-center gap-2">
            <Users size={16} />
            <span>Student Status</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {participants.map((p) => (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border-2 flex items-center justify-between text-sm transition-all ${
                  p.has_submitted
                    ? 'bg-[#e6ffe6] border-[#00ff04] text-[#08660a] shadow-xs'
                    : 'bg-white border-[#d8d3ca] text-[#191817]'
                }`}
              >
                <span className="font-semibold truncate mr-2">{p.display_name}</span>
                {p.has_submitted ? (
                  <CheckCircle2 size={16} className="text-[#00cc05] shrink-0" />
                ) : (
                  <span className="text-[11px] font-bold text-[#77736c] shrink-0">Writing…</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-10 pt-6 border-t border-[#d8d3ca] flex justify-end">
          <button
            onClick={() => setShowConfirmEnd(true)}
            className="flex items-center gap-2 bg-white hover:bg-[#fee2e2] text-[#ff0000] hover:text-[#990000] border-2 border-[#ff0000] px-5 py-2.5 rounded-xl font-bold text-sm shadow-[2px_2px_0_#ff0000] hover:shadow-[3px_3px_0_#990000] transition-all cursor-pointer"
          >
            <Square size={16} fill="currentColor" />
            <span>End Quiz Early</span>
          </button>
        </div>
      </div>

      {/* In-app End Quiz Confirmation Modal */}
      {showConfirmEnd && (
        <div className="fixed inset-0 bg-[#191817]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="kz-card p-6 md:p-8 max-w-md w-full bg-white border-2 border-[#191817] shadow-[6px_6px_0_#191817] rounded-3xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#ff0000] border-2 border-[#191817] flex items-center justify-center shadow-[3px_3px_0_#191817] mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-2xl font-black text-[#191817] mb-2">
              End Quiz Early?
            </h3>
            <p className="text-sm text-[#77736c] mb-6">
              This will immediately lock answer submissions for all students and display the final leaderboard.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowConfirmEnd(false)}
                className="kz-btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEndQuiz}
                disabled={ending}
                className="bg-[#ff0000] hover:bg-[#cc0000] text-white border-2 border-[#191817] shadow-[2.5px_2.5px_0_#191817] px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Square size={14} fill="currentColor" />
                <span>{ending ? 'Ending...' : 'Yes, End Quiz'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
