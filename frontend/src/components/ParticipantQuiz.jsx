import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Send, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, HelpCircle, Loader2 } from 'lucide-react';
import { submitQuizAnswers } from '../utils/api';

const OPTION_THEMES = {
  a: {
    key: 'A',
    bg: '#e6f9ff',
    border: '#05cdff',
    pillBg: '#05cdff',
    pillText: '#ffffff',
    text: '#034a6e',
    selectedBg: '#05cdff',
    selectedText: '#ffffff',
    activeBorder: '#191817',
    label: 'A',
  },
  b: {
    key: 'B',
    bg: '#ffebe8',
    border: '#ff0000',
    pillBg: '#ff0000',
    pillText: '#ffffff',
    text: '#990000',
    selectedBg: '#ff0000',
    selectedText: '#ffffff',
    activeBorder: '#191817',
    label: 'B',
  },
  c: {
    key: 'C',
    bg: '#e6ffe6',
    border: '#00ff04',
    pillBg: '#00cc05',
    pillText: '#ffffff',
    text: '#08660a',
    selectedBg: '#00cc05',
    selectedText: '#ffffff',
    activeBorder: '#191817',
    label: 'C',
  },
  d: {
    key: 'D',
    bg: '#f3eaff',
    border: '#8000ff',
    pillBg: '#8000ff',
    pillText: '#ffffff',
    text: '#4a0099',
    selectedBg: '#8000ff',
    selectedText: '#ffffff',
    activeBorder: '#191817',
    label: 'D',
  },
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ParticipantQuiz({ session, participant, onSubmitSuccess }) {
  const pin = session.game_pin;
  const questions = session.questions || [];
  const totalQuestions = questions.length;

  // Answer draft in sessionStorage
  const draftKey = `koozy_draft_${pin}_${participant?.id || 'guest'}`;
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return session.participant?.submitted_answers || {};
  });

  // Current Question Index (ONE QUESTION AT A TIME)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(session.seconds_remaining || 0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Persist answers draft to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(answers));
    } catch (e) {}
  }, [answers, draftKey]);

  // Sync remaining seconds from server prop
  useEffect(() => {
    if (session.seconds_remaining !== undefined) {
      setSecondsRemaining(session.seconds_remaining);
    }
  }, [session.seconds_remaining]);

  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const currentDraft = answersRef.current || {};
      const res = await submitQuizAnswers(pin, currentDraft);
      sessionStorage.removeItem(draftKey);
      if (onSubmitSuccess) onSubmitSuccess(res);
    } catch (err) {
      console.error('Auto submit error', err);
      if (onSubmitSuccess) onSubmitSuccess();
    }
  }, [submitting, pin, draftKey, onSubmitSuccess]);

  // Global countdown timer & auto-submit on completion
  useEffect(() => {
    if (session.status === 'COMPLETED' || (session.seconds_remaining !== undefined && session.seconds_remaining <= 0)) {
      handleAutoSubmit();
      return;
    }

    if (secondsRemaining <= 0) {
      handleAutoSubmit();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session.status, session.seconds_remaining, secondsRemaining, handleAutoSubmit]);

  const handleSelectOption = (questionId, optionKey) => {
    if (submitting) return;
    setAnswers((prev) => {
      const current = prev[questionId];
      const updated = { ...prev };
      if (current === optionKey) {
        // Toggle/Deselect
        delete updated[questionId];
      } else {
        updated[questionId] = optionKey;
      }
      return updated;
    });
  };

  const handleManualSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await submitQuizAnswers(pin, answers);
      sessionStorage.removeItem(draftKey);
      if (onSubmitSuccess) onSubmitSuccess(res);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit quiz.');
      setSubmitting(false);
    }
  };

  const currentQ = questions[currentIndex] || questions[0];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const isTimeLow = secondsRemaining <= 30;
  const currentSelected = currentQ ? answers[currentQ.id] : null;

  if (!currentQ || totalQuestions === 0) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <div className="kz-card p-8 bg-white border-2 border-[#191817]">
          <h2 className="text-2xl font-bold mb-2">No Questions Found</h2>
          <p className="text-sm text-[#77736c]">This quiz has no questions loaded.</p>
        </div>
      </div>
    );
  }

  const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Top Header / Progress & Global Timer */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 bg-[#fffdf7] p-4 md:p-5 rounded-2xl border-2 border-[#191817] shadow-[3px_3px_0_#191817]">
        {/* Question Counter + Progress */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-[#77736c] mb-1.5">
            <span className="text-[#191817] font-extrabold text-sm">
              Question {currentIndex + 1} <span className="text-[#77736c] font-normal">/ {totalQuestions}</span>
            </span>
            <span>{answeredCount} of {totalQuestions} answered</span>
          </div>
          <div className="w-full h-2.5 bg-[#ebe7df] rounded-full overflow-hidden border border-[#d8d3ca]">
            <div
              className="h-full bg-[#6c4de8] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Global Timer + Submit Quick Action */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
              isTimeLow
                ? 'bg-[#fee2e2] border-[#ff0000] text-[#ff0000] animate-bounce'
                : 'bg-white border-[#191817] text-[#191817]'
            }`}
          >
            <Clock size={18} className={isTimeLow ? 'text-[#ff0000]' : 'text-[#6c4de8]'} />
            <span className="font-mono text-xl font-black">{formatTime(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting}
            className="kz-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send size={14} />
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* Main Single Question Card with Strong Purple Border (Spec Section 14) */}
      <div className="kz-card p-6 md:p-10 mb-6 bg-white border-2 border-[#6c4de8] shadow-[4px_4px_0_#6c4de8] rounded-3xl relative">
        {/* Question Header & Text */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block text-xs font-black uppercase tracking-wider bg-[#eeeafd] text-[#6c4de8] px-3 py-1 rounded-lg border border-[#c9bfff]">
              Q{currentIndex + 1}
            </span>
            {currentSelected && (
              <span className="text-xs font-bold text-[#00cc05] flex items-center gap-1 bg-[#e6ffe6] px-2.5 py-0.5 rounded-md border border-[#a3ffa5]">
                <CheckCircle2 size={13} /> Selected {currentSelected.toUpperCase()}
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#191817] leading-snug tracking-tight">
            {currentQ.question_text}
          </h2>
        </div>

        {/* 4 Answer Choice Buttons (Permanent A/B/C/D Colors - Spec Section 13) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {['a', 'b', 'c', 'd'].map((key) => {
            const optText = currentQ[`option_${key}`];
            if (!optText && key !== 'a' && key !== 'b') return null; // Skip optional empty C/D if any

            const theme = OPTION_THEMES[key];
            const isSelected = currentSelected === key;

            return (
              <button
                key={key}
                onClick={() => handleSelectOption(currentQ.id, key)}
                disabled={submitting}
                className={`p-4 md:p-5 rounded-2xl text-left transition-all flex items-start gap-3.5 cursor-pointer relative ${
                  isSelected
                    ? 'border-2.5 border-[#191817] shadow-[4px_4px_0_#191817] translate-x-[-1px] translate-y-[-1px]'
                    : 'border-2 hover:shadow-[3px_3px_0_#191817] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                }`}
                style={{
                  backgroundColor: isSelected ? theme.selectedBg : theme.bg,
                  borderColor: isSelected ? '#191817' : theme.border,
                  color: isSelected ? '#ffffff' : theme.text,
                }}
              >
                {/* Fixed Color Letter Badge */}
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shrink-0 border border-[#191817]/20 shadow-xs"
                  style={{
                    backgroundColor: isSelected ? '#ffffff' : theme.pillBg,
                    color: isSelected ? theme.pillBg : theme.pillText,
                  }}
                >
                  {theme.label}
                </span>

                {/* Option Text */}
                <div className="flex-1 pt-1 font-bold text-base md:text-lg leading-snug">
                  {optText || `Option ${theme.label}`}
                </div>

                {/* Selected Checkmark Icon */}
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-white text-[#191817] flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <CheckCircle2 size={18} fill="currentColor" className="text-white fill-[#191817]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Question Navigator with Circular Buttons & Previous/Next (Spec Section 12) */}
      <div className="kz-card p-4 md:p-6 bg-[#fffdf7] border-2 border-[#191817] shadow-[3px_3px_0_#191817] flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Circular Navigator Strip with Prev/Next Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          {/* Previous Question Button */}
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="p-2.5 bg-white hover:bg-[#eeeafd] disabled:opacity-30 disabled:cursor-not-allowed text-[#191817] rounded-xl border-2 border-[#191817] shadow-[2px_2px_0_#191817] cursor-pointer transition-all shrink-0"
            title="Previous Question"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Circular Question Numbers */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 max-w-full justify-center">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isCurrent
                      ? 'border-3 border-[#6c4de8] ring-3 ring-[#6c4de8]/30 scale-110 shadow-md font-black ' +
                        (isAnswered ? 'bg-[#6c4de8] text-white' : 'bg-white text-[#6c4de8]')
                      : isAnswered
                      ? 'bg-[#6c4de8] text-white border-2 border-[#191817] shadow-[1.5px_1.5px_0_#191817]'
                      : 'bg-white text-[#191817] border-2 border-[#d8d3ca] hover:border-[#191817]'
                  }`}
                  title={`Question ${idx + 1} (${isAnswered ? 'Answered' : 'Unanswered'})`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Next Question Button */}
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            disabled={currentIndex === totalQuestions - 1}
            className="p-2.5 bg-white hover:bg-[#eeeafd] disabled:opacity-30 disabled:cursor-not-allowed text-[#191817] rounded-xl border-2 border-[#191817] shadow-[2px_2px_0_#191817] cursor-pointer transition-all shrink-0"
            title="Next Question"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Submit Quiz Action Button (Bottom) */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {submitError && (
            <span className="text-xs font-bold text-[#ff0000]">{submitError}</span>
          )}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting}
            className="kz-btn-primary px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center disabled:opacity-50"
          >
            <Send size={16} />
            <span>{submitting ? 'Submitting...' : 'Submit Quiz →'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-[#191817]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="kz-card p-6 md:p-8 max-w-md w-full bg-white border-2 border-[#191817] shadow-[6px_6px_0_#191817] rounded-3xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#eeeafd] text-[#6c4de8] border-2 border-[#191817] flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={26} />
            </div>

            <h3 className="text-2xl font-black text-[#191817] mb-2">
              Ready to submit your quiz?
            </h3>

            <p className="text-sm text-[#77736c] mb-6">
              You answered <span className="font-bold text-[#6c4de8]">{answeredCount}</span> of{' '}
              <span className="font-bold text-[#191817]">{totalQuestions}</span> questions.
              {unansweredCount > 0 && (
                <span className="block mt-1 font-semibold text-[#ff0000]">
                  ⚠️ You still have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.
                </span>
              )}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="kz-btn-secondary px-5 py-2.5 rounded-xl font-bold text-sm flex-1"
              >
                Keep Answering
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="kz-btn-primary px-5 py-2.5 rounded-xl font-bold text-sm flex-1 flex items-center justify-center gap-1.5"
              >
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finishing / Auto-Submitting Overlay */}
      {(submitting || session.status === 'COMPLETED') && (
        <div className="fixed inset-0 bg-[#191817]/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="kz-card p-8 max-w-md w-full bg-white border-2 border-[#191817] shadow-[8px_8px_0_#191817] rounded-3xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#eeeafd] text-[#6c4de8] border-2 border-[#191817] flex items-center justify-center shadow-[3px_3px_0_#191817] mx-auto mb-4 animate-spin">
              <Loader2 size={28} />
            </div>

            <h3 className="text-2xl font-black text-[#191817] mb-2">
              {session.status === 'COMPLETED' ? 'Quiz Concluded!' : 'Submitting Answers...'}
            </h3>
            <p className="text-sm font-bold text-[#77736c] mb-2">
              Saving your answers and loading your score...
            </p>
            <p className="text-xs text-[#6c4de8] font-bold">
              {answeredCount} of {totalQuestions} questions answered
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

