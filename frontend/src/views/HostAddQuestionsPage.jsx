import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Play, ArrowLeft, ArrowUp, ArrowDown, Edit3, Check, X, RotateCcw } from 'lucide-react';
import { fetchQuizDetail, addQuestion, updateQuestion, deleteQuestion, createLiveSession, reorderQuestions } from '../utils/api';
import UserProfileBadge from '../components/UserProfileBadge';
import { playSfx, playSfxAndNavigate } from '../utils/sfx';

export default function HostAddQuestionsPage({ quizId, initialQuiz = null }) {
  const [quiz, setQuiz] = useState(initialQuiz);
  const [questions, setQuestions] = useState(initialQuiz?.questions || []);
  const [loading, setLoading] = useState(!initialQuiz);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  const formRef = useRef(null);

  // Question form state — NO default 'a', must be chosen explicitly by host
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [timeLimit, setTimeLimit] = useState(20);

  const [deletingId, setDeletingId] = useState(null);
  const qid = quizId || quiz?.id || (window.location.pathname.match(/\/host\/quizzes\/(\d+)/) || [])[1];

  useEffect(() => {
    if (!qid) return;
    fetchQuizDetail(qid)
      .then((data) => {
        setQuiz(data.quiz);
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [qid]);

  const handleStartEdit = (question) => {
    setEditingQuestionId(question.id);
    setQuestionText(question.question_text || '');
    setOptionA(question.option_a || '');
    setOptionB(question.option_b || '');
    setOptionC(question.option_c || '');
    setOptionD(question.option_d || '');
    setCorrectAnswer(question.correct_answer || '');
    setTimeLimit(question.time_limit || 20);
    setError('');

    // Scroll form into view
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectAnswer('');
    setTimeLimit(20);
    setError('');
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      setError('Question text and all 4 options (A, B, C, D) are required');
      return;
    }

    if (!correctAnswer) {
      setError('Please select which option (A, B, C, or D) is the correct answer.');
      return;
    }

    setSubmitting(true);
    setError('');

    const targetQuizId = qid || quiz?.id;
    const payload = {
      question_text: questionText.trim(),
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      option_c: optionC.trim(),
      option_d: optionD.trim(),
      correct_answer: correctAnswer,
      time_limit: parseInt(timeLimit, 10) || 20,
    };

    try {
      if (editingQuestionId) {
        // Edit existing question
        const res = await updateQuestion(targetQuizId, editingQuestionId, payload);
        playSfx('success');
        setQuestions((prev) =>
          prev.map((q) => (q.id === editingQuestionId ? res.question : q))
        );
        handleCancelEdit();
      } else {
        // Add new question
        const res = await addQuestion(targetQuizId, payload);
        playSfx('success');
        setQuestions((prev) => [...prev, res.question]);
        setQuestionText('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setCorrectAnswer('');
      }
      setSubmitting(false);
    } catch (err) {
      playSfx('error');
      setError(err.message || 'Failed to save question');
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!questionId) return;
    const targetQuizId = qid || quiz?.id;
    if (!targetQuizId) return;

    playSfx('disconnect');
    setDeletingId(questionId);
    const previousQuestions = [...questions];
    // Optimistic UI update — remove immediately
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));

    try {
      await deleteQuestion(targetQuizId, questionId);
      setDeletingId(null);
    } catch (err) {
      console.error('Delete question error', err);
      // Revert if server failed
      setQuestions(previousQuestions);
      setError(err.message || 'Failed to delete question');
      setDeletingId(null);
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    playSfx('tick-immersive');

    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;
    setQuestions(newQuestions);

    try {
      const ids = newQuestions.map((q) => q.id);
      await reorderQuestions(qid, ids);
    } catch (err) {
      console.error('Failed to save question order', err);
    }
  };

  const handleStartSession = async () => {
    setStarting(true);
    playSfx('button');
    try {
      const res = await createLiveSession(qid);
      playSfxAndNavigate('success', `/host/sessions/${res.session_id}/`, 450);
    } catch (err) {
      playSfx('error');
      alert(err.message || 'Failed to create live session');
      setStarting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Top Navbar */}
      <nav className="flex justify-between items-center pb-6 border-b border-[#d8d3ca] mb-8">
        <a href="/" className="font-hand text-4xl text-[#191817] hover:text-[#6c4de8] transition-colors -rotate-2 select-none">
          Koozy
        </a>
        <div className="flex gap-3 items-center">
          <a
            href="/host/quizzes/"
            className="kz-btn-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>My Quizzes</span>
          </a>
          <UserProfileBadge />
        </div>
      </nav>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="font-hand text-2xl text-[#6c4de8] -rotate-1 select-none">
            authoring questions ✦
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#191817] tracking-tight">
            {quiz?.title || 'Quiz Questions'}
          </h1>
          <p className="text-sm text-[#77736c] mt-0.5">
            {questions.length} Question{questions.length === 1 ? '' : 's'} in this quiz
          </p>
        </div>

        {questions.length > 0 && (
          <button
            onClick={handleStartSession}
            disabled={starting}
            className="kz-btn-primary px-8 py-3.5 rounded-xl font-bold text-base flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Play size={18} fill="currentColor" />
            <span>{starting ? 'Starting...' : 'Host Live Session →'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Add / Edit Question */}
        <div className="lg:col-span-7">
          <div
            ref={formRef}
            className={`kz-card p-6 md:p-8 bg-[#fffdf7] border-2 shadow-[4px_4px_0_#191817] rounded-3xl sticky top-6 transition-all ${
              editingQuestionId ? 'border-[#6c4de8] ring-2 ring-[#6c4de8]/20' : 'border-[#191817]'
            }`}
          >
            {editingQuestionId ? (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#eeeafd] text-[#6c4de8] flex items-center justify-center border border-[#c9bfff]">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-[#191817] tracking-tight">
                      Edit Question
                    </h2>
                    <p className="text-xs text-[#6c4de8] font-bold">
                      Modifying existing question in quiz
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-[#77736c] hover:text-[#191817] bg-[#f7f5ef] hover:bg-[#eae6df] border border-[#d8d3ca] px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                  title="Cancel editing and create new question"
                >
                  <RotateCcw size={13} />
                  <span>Cancel Edit</span>
                </button>
              </div>
            ) : (
              <h2 className="text-xl font-extrabold text-[#191817] mb-4 flex items-center gap-2">
                <Plus size={20} className="text-[#6c4de8]" />
                <span>Add a Question</span>
              </h2>
            )}

            <form onSubmit={handleSubmitQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#191817] mb-1">
                  Question Text *
                </label>
                <textarea
                  placeholder="e.g. Which of the following is an immutable data type in Python?"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-4 py-2.5 bg-white border-2 border-[#d8d3ca] focus:border-[#6c4de8] rounded-xl text-sm font-semibold outline-none transition-colors resize-none"
                />
              </div>

              {/* 4 Options Grid with Correct Answer Picker */}
              <div>
                {/* Segmented Correct Answer Selector Bar */}
                <div className="p-3.5 bg-[#f7f5ef] border-2 border-[#191817] rounded-2xl mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-[#191817]">
                      Which option is correct? *
                    </label>
                    <span className="text-[11px] font-bold text-[#6c4de8]">
                      {correctAnswer ? `Option ${correctAnswer.toUpperCase()} selected` : 'Required (click to select)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'a', label: 'A', name: 'Option A (Blue)', color: '#05cdff' },
                      { key: 'b', label: 'B', name: 'Option B (Red)', color: '#ff0000' },
                      { key: 'c', label: 'C', name: 'Option C (Green)', color: '#00cc05' },
                      { key: 'd', label: 'D', name: 'Option D (Purple)', color: '#8000ff' },
                    ].map(({ key, label, name }) => {
                      const isSelected = correctAnswer === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          id={`quick-select-correct-${key}`}
                          onClick={() => setCorrectAnswer(key)}
                          className={`py-2.5 px-2 rounded-xl font-extrabold text-xs flex flex-col items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#191817] text-white border-[#191817] shadow-[2.5px_2.5px_0_#6c4de8] scale-[1.02]'
                              : 'bg-white text-[#191817] border-[#d8d3ca] hover:border-[#191817] hover:bg-[#fffdf7]'
                          }`}
                          title={`Select ${name} as the correct answer`}
                        >
                          <span className="text-base font-black leading-none">{label}</span>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-[#00ff04]' : 'text-[#77736c]'}`}>
                            {isSelected ? '✓ CORRECT' : 'SELECT'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {!correctAnswer && (
                    <p className="text-[11px] text-[#b91c1c] font-bold mt-2 text-center">
                      ✦ Click A, B, C, or D above to choose the correct answer
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#191817]">
                    Option Text & Values *
                  </label>
                  <span className="text-[11px] font-bold text-[#77736c]">
                    Fill in all 4 choices
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { key: 'a', label: 'Option A (Blue)', val: optionA, set: setOptionA },
                    { key: 'b', label: 'Option B (Red)', val: optionB, set: setOptionB },
                    { key: 'c', label: 'Option C (Green)', val: optionC, set: setOptionC },
                    { key: 'd', label: 'Option D (Purple)', val: optionD, set: setOptionD },
                  ].map(({ key, label, val, set }) => {
                    const isCorrect = correctAnswer === key;
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          isCorrect
                            ? 'bg-white border-[#191817] shadow-[3px_3px_0_#191817] ring-2 ring-[#00cc05]'
                            : 'bg-white border-[#d8d3ca] hover:border-[#aaa69d]'
                        }`}
                      >
                        {/* Radio selection input & badge */}
                        <button
                          type="button"
                          id={`option-btn-${key}`}
                          data-sfx-special="true"
                          onClick={() => {
                            playSfx('choose-answer-pop-button');
                            setCorrectAnswer(key);
                          }}
                          className={`w-9 h-9 rounded-lg font-black text-sm flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer ${
                            isCorrect
                              ? 'bg-[#191817] text-white border-[#191817] shadow-sm'
                              : 'bg-[#f7f5ef] text-[#77736c] border-[#d8d3ca] hover:border-[#191817] hover:text-[#191817]'
                          }`}
                          title={`Click to mark Option ${key.toUpperCase()} as correct`}
                        >
                          {key.toUpperCase()}
                        </button>

                        <input
                          type="text"
                          placeholder={label}
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          required
                          className="flex-1 bg-transparent text-sm font-semibold outline-none py-1"
                        />

                        {isCorrect ? (
                          <button
                            type="button"
                            data-sfx-special="true"
                            onClick={() => {
                              playSfx('choose-answer-pop-button');
                              setCorrectAnswer(key);
                            }}
                            className="text-[11px] font-black uppercase tracking-wider text-[#08660a] bg-[#e6ffe6] px-2.5 py-1 rounded-lg border border-[#a3ffa5] shrink-0 cursor-pointer shadow-xs"
                          >
                            ✓ Correct
                          </button>
                        ) : (
                          <button
                            type="button"
                            data-sfx-special="true"
                            onClick={() => {
                              playSfx('choose-answer-pop-button');
                              setCorrectAnswer(key);
                            }}
                            className="text-[11px] font-bold uppercase tracking-wider text-[#77736c] hover:text-[#191817] bg-[#f7f5ef] hover:bg-[#eeeafd] hover:text-[#6c4de8] px-2.5 py-1 rounded-lg border border-[#d8d3ca] shrink-0 cursor-pointer transition-colors"
                          >
                            Mark Correct
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[#fee2e2] text-[#ff0000] text-xs font-bold rounded-xl border border-[#fca5a5]">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={submitting}
                    className="px-4 py-3.5 rounded-xl border-2 border-[#191817] font-bold text-sm text-[#191817] hover:bg-[#f7f5ef] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="kz-btn-primary flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {editingQuestionId ? (
                    <>
                      <Check size={16} />
                      <span>{submitting ? 'Saving Changes...' : 'Save Changes →'}</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>{submitting ? 'Adding...' : 'Add Question'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right List: Current Questions with Reorder Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#77736c]">
              Questions in this Quiz ({questions.length})
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#77736c] font-bold">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="kz-card p-8 text-center bg-white border-2 border-dashed border-[#d8d3ca] rounded-2xl">
              <p className="text-sm text-[#77736c] italic">
                No questions added yet. Use the form on the left to add your first question.
              </p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const isEditingThis = editingQuestionId === q.id;

              return (
                <div
                  key={q.id || idx}
                  className={`kz-card p-5 bg-white border-2 rounded-2xl relative transition-all ${
                    isEditingThis
                      ? 'border-[#6c4de8] shadow-[3.5px_3.5px_0_#6c4de8] ring-2 ring-[#6c4de8]/20 bg-[#fffdfa]'
                      : 'border-[#191817] shadow-[2.5px_2.5px_0_#191817]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#6c4de8] bg-[#eeeafd] px-2 py-0.5 rounded-md border border-[#c9bfff]">
                        Q{idx + 1}
                      </span>
                      {isEditingThis && (
                        <span className="text-[11px] font-black text-[#6c4de8] bg-[#eeeafd] px-2 py-0.5 rounded-md border border-[#6c4de8] animate-pulse">
                          ✏️ Editing
                        </span>
                      )}
                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleMove(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-[#77736c] hover:text-[#191817] disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-[#f7f5ef] cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMove(idx, 1)}
                          disabled={idx === questions.length - 1}
                          className="p-1 text-[#77736c] hover:text-[#191817] disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-[#f7f5ef] cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        id={`edit-question-btn-${q.id}`}
                        data-sfx="tick"
                        onClick={() => handleStartEdit(q)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isEditingThis
                            ? 'text-[#6c4de8] bg-[#eeeafd] ring-1 ring-[#6c4de8]'
                            : 'text-[#77736c] hover:text-[#6c4de8] hover:bg-[#eeeafd]'
                        }`}
                        title="Edit Question"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        id={`delete-question-btn-${q.id}`}
                        onClick={() => handleDeleteQuestion(q.id)}
                        disabled={deletingId === q.id}
                        className="p-1.5 text-[#77736c] hover:text-[#ff0000] hover:bg-[#fee2e2] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-[#191817] mb-3 leading-snug">
                    {q.question_text}
                  </h4>

                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {['a', 'b', 'c', 'd'].map((k) => {
                      const text = q[`option_${k}`];
                      if (!text) return null;
                      const isCorrect = q.correct_answer === k;
                      return (
                        <div
                          key={k}
                          className={`p-1.5 rounded-lg truncate ${
                            isCorrect
                              ? 'bg-[#e6ffe6] text-[#08660a] font-bold border border-[#a3ffa5]'
                              : 'bg-[#f7f5ef] text-[#77736c]'
                          }`}
                        >
                          <span className="font-bold uppercase mr-1">{k}:</span>
                          <span>{text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
