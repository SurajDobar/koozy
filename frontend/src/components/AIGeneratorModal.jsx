import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Check, AlertCircle, Loader2, BookOpen, Layers, HelpCircle, FileCode } from 'lucide-react';
import { generateAIQuiz, fetchAIQuota, fetchAIPromptTemplate } from '../utils/api';

const STARTER_PROMPTS = [
  'Python Data Structures (Lists, Dictionaries, Sets & Tuples)',
  'JavaScript Async Programming, Promises & Event Loop',
  'World Geography: Capitals, Landmarks & Continents',
  'Biology: Cell Structure, Mitosis & Photosynthesis',
];

export default function AIGeneratorModal({ isOpen, onClose, onGenerated }) {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'copy_prompt'
  const [prompt, setPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quota, setQuota] = useState({ remaining: 8, limit: 8 });
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState('');

  // Load quota and prompt template on open
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    fetchAIQuota()
      .then((data) => setQuota(data))
      .catch((err) => console.error('Failed to load AI quota', err));

    fetchAIPromptTemplate()
      .then((data) => setPromptTemplate(data.prompt_template || ''))
      .catch((err) => console.error('Failed to load prompt template', err));
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please describe your quiz topic or instructions.');
      return;
    }

    const count = parseInt(questionCount, 10);
    if (isNaN(count) || count < 1 || count > 25) {
      setError('Please choose between 1 and 25 questions.');
      return;
    }

    if (quota.remaining <= 0) {
      setError('Daily AI generation limit reached (8/8 attempts used today). Please try again tomorrow.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await generateAIQuiz({
        prompt: prompt.trim(),
        question_count: count,
      });

      setLoading(false);
      if (onGenerated) {
        onGenerated(res.quiz_id || res.id);
      } else {
        window.location.href = `/host/quizzes/${res.quiz_id || res.id}/questions/add/`;
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate quiz. Please try again.');
      setLoading(false);
      // Refresh quota in case an attempt was recorded
      fetchAIQuota().then((data) => setQuota(data)).catch(() => {});
    }
  };

  const handleCopyTemplate = () => {
    if (!promptTemplate) return;
    navigator.clipboard.writeText(promptTemplate);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191817]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-[#fffdf7] border-3 border-[#191817] shadow-[8px_8px_0px_#191817] rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#f7f5ef] px-6 py-4 border-b-2 border-[#191817] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#6c4de8] text-white flex items-center justify-center border-2 border-[#191817] shadow-[2px_2px_0px_#191817]">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#191817] tracking-tight">
                AI Quiz Generator
              </h2>
              <p className="text-xs text-[#77736c] font-semibold">
                Generate high-quality multiple choice quizzes with Gemini
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-xl bg-white border-2 border-[#191817] hover:bg-[#fff0f0] hover:text-[#ff0000] flex items-center justify-center text-[#191817] shadow-[2px_2px_0px_#191817] hover:shadow-[3px_3px_0px_#ff0000] transition-all cursor-pointer disabled:opacity-50"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b-2 border-[#191817] bg-[#ffffff]">
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-3 px-4 text-xs font-black flex items-center justify-center gap-2 border-r-2 border-[#191817] transition-all cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-[#eeeafd] text-[#6c4de8]'
                : 'text-[#77736c] hover:bg-[#f7f5ef] hover:text-[#191817]'
            }`}
          >
            <Sparkles size={15} />
            <span>✨ Gemini Generator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('copy_prompt')}
            className={`flex-1 py-3 px-4 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'copy_prompt'
                ? 'bg-[#eeeafd] text-[#6c4de8]'
                : 'text-[#77736c] hover:bg-[#f7f5ef] hover:text-[#191817]'
            }`}
          >
            <FileCode size={15} />
            <span>📋 Copy Prompt for ChatGPT / Claude</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'generate' ? (
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Daily Quota Pill Banner */}
              <div className="flex items-center justify-between bg-white border-2 border-[#191817] shadow-[2px_2px_0px_#191817] rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00cc05] animate-pulse"></span>
                  <span className="text-xs font-black text-[#191817]">Daily AI Quota:</span>
                  <span className="text-xs font-bold text-[#6c4de8] bg-[#eeeafd] px-2 py-0.5 rounded-md border border-[#c9bfff]">
                    {quota.remaining} of {quota.limit} attempts left today
                  </span>
                </div>
                <span className="text-[10px] text-[#77736c] font-semibold">Resets daily</span>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-2.5 bg-[#fff0f0] border-2 border-[#ff0000] text-[#ff0000] p-3.5 rounded-2xl text-xs font-bold shadow-[2px_2px_0px_#ff0000]">
                  <AlertCircle size={17} className="shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Prompt Input */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#191817] mb-2 flex items-center justify-between">
                  <span>Quiz Topic & Specifications *</span>
                  <span className="text-[11px] text-[#77736c] font-bold lowercase">
                    {prompt.length}/1000
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                  maxLength={1000}
                  placeholder="e.g. Create a 5-question quiz on Python dictionaries and sets. Focus on methods (.get(), .keys()), set operations, and time complexity. Keep difficulty medium."
                  className="w-full px-4 py-3 bg-white border-2 border-[#191817] focus:border-[#6c4de8] rounded-2xl text-sm font-semibold outline-none transition-colors shadow-[2px_2px_0px_#191817] placeholder:text-[#a8a49c]"
                  required
                />
              </div>

              {/* Starter Prompt Chips */}
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#77736c] block mb-2">
                  Quick Starter Topics:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {STARTER_PROMPTS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      disabled={loading}
                      onClick={() => setPrompt(starter)}
                      className="text-xs font-bold bg-white border border-[#d8d3ca] hover:border-[#6c4de8] hover:bg-[#eeeafd] hover:text-[#6c4de8] px-2.5 py-1 rounded-xl transition-all cursor-pointer text-left truncate max-w-full"
                    >
                      ✦ {starter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count Selector (1-25) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#191817]">
                    Number of Questions (1 – 25)
                  </label>
                  <span className="text-xs font-black bg-[#6c4de8] text-white px-2.5 py-0.5 rounded-lg">
                    {questionCount} Questions
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[3, 5, 10, 15, 20, 25].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      disabled={loading}
                      onClick={() => setQuestionCount(cnt)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black border-2 border-[#191817] transition-all cursor-pointer ${
                        questionCount === cnt
                          ? 'bg-[#6c4de8] text-white shadow-[2px_2px_0px_#191817]'
                          : 'bg-white text-[#191817] hover:bg-[#eeeafd] hover:border-[#6c4de8]'
                      }`}
                    >
                      {cnt} Qs
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-5 py-3 rounded-2xl border-2 border-[#191817] text-xs font-black text-[#191817] hover:bg-[#f7f5ef] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || quota.remaining <= 0}
                  className="kz-btn-primary px-7 py-3 rounded-2xl font-black text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Generating with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Generate Quiz ({questionCount} Questions) →</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* External LLM Copy Prompt Tab */
            <div className="space-y-4">
              <div className="bg-[#f7f5ef] p-4 rounded-2xl border-2 border-[#191817] text-xs text-[#191817] leading-relaxed">
                <p className="font-bold mb-1">
                  💡 Use this prompt with ChatGPT, Claude, DeepSeek, or any other LLM:
                </p>
                <p className="text-[#77736c]">
                  Copy the system template below, paste it into your AI assistant with your topic, and copy the returned JSON. Then click <strong>Import JSON</strong> on your Koozy dashboard to import your quiz instantly.
                </p>
              </div>

              <div className="relative">
                <pre className="bg-[#191817] text-[#00ff66] font-mono text-xs p-4 rounded-2xl overflow-x-auto max-h-72 border-2 border-[#191817] select-all">
                  {promptTemplate || 'Loading prompt template...'}
                </pre>

                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="absolute top-3 right-3 bg-white text-[#191817] border-2 border-[#191817] shadow-[2px_2px_0px_#191817] hover:bg-[#eeeafd] hover:text-[#6c4de8] px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:translate-y-0.5"
                >
                  {copiedPrompt ? (
                    <>
                      <Check size={14} className="text-[#00cc05] stroke-[3]" />
                      <span className="text-[#00cc05]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Instructions</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl border-2 border-[#191817] text-xs font-black text-[#191817] hover:bg-[#f7f5ef] transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
