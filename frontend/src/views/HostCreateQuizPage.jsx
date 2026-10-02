import React, { useState } from 'react';
import { ArrowLeft, Sparkles, HelpCircle } from 'lucide-react';
import { createQuiz } from '../utils/api';
import UserProfileBadge from '../components/UserProfileBadge';
import AIGeneratorModal from '../components/AIGeneratorModal';
import { playSfx, playSfxAndNavigate } from '../utils/sfx';

export default function HostCreateQuizPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [difficulty, setDifficulty] = useState('medium');
  const [timeLimit, setTimeLimit] = useState(300); // 5 mins default in seconds
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);

  const config = typeof window !== 'undefined' ? (window.__KOOZY_CONFIG__ || {}) : {};
  const user = config.user || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    playSfx('button');
    if (!title.trim()) {
      playSfx('error');
      setError('Quiz title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await createQuiz({
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        time_limit: parseInt(timeLimit, 10),
      });

      playSfxAndNavigate('success', `/host/quizzes/${data.id}/questions/`, 450);
    } catch (err) {
      playSfx('error');
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
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
            <span>Back to Library</span>
          </a>
          <UserProfileBadge user={user} />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="font-hand text-2xl text-[#6c4de8] -rotate-1 mb-1 select-none">
              step 1 of 2 ✦
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#191817] tracking-tight mb-1">
              Create New Quiz
            </h1>
            <p className="text-sm text-[#77736c]">
              Set the quiz details manually, or generate a complete quiz instantly with Gemini AI.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAIModal(true)}
            className="kz-btn-primary px-4 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 bg-[#6c4de8] text-white border-2 border-[#191817] shadow-[2px_2px_0px_#191817] hover:shadow-[3px_3px_0px_#191817] shrink-0 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>✨ Generate with AI</span>
          </button>
        </div>

        <div className="kz-card p-8 md:p-10 bg-[#fffdf7]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#191817] mb-1.5">
                Quiz Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Python Fundamentals Quick Check"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border-2 border-[#d8d3ca] focus:border-[#6c4de8] rounded-xl text-base font-semibold outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#191817] mb-1.5">
                Description (Optional)
              </label>
              <textarea
                placeholder="Short summary for your students..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white border-2 border-[#d8d3ca] focus:border-[#6c4de8] rounded-xl text-sm font-medium outline-none transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#191817] mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-[#d8d3ca] focus:border-[#6c4de8] rounded-xl text-sm font-semibold outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#191817] mb-1.5">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-[#d8d3ca] focus:border-[#6c4de8] rounded-xl text-sm font-semibold outline-none transition-colors"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#191817] mb-1.5">
                  Time Limit (Sec)
                </label>
                <input
                  type="number"
                  min="30"
                  max="3600"
                  value={timeLimit}
                  onChange={(e) => {
                    playSfx('tick-immersive');
                    setTimeLimit(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 bg-white border-2 border-[#d8d3ca] focus:border-[#6c4de8] rounded-xl text-sm font-semibold font-mono outline-none transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[#fee2e2] text-[#b91c1c] text-xs font-bold rounded-xl border border-[#fca5a5]">
                {error}
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <a
                href="/host/quizzes/"
                className="kz-btn-secondary px-6 py-3 rounded-xl font-bold text-sm"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={loading}
                className="kz-btn-primary px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>{loading ? 'Creating...' : 'Save & Add Questions →'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AI Quiz Generator Modal */}
      <AIGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerated={(quizId) => {
          window.location.href = `/host/quizzes/${quizId}/questions/`;
        }}
      />
    </div>
  );
}
