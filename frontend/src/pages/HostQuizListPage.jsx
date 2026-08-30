import React, { useState, useEffect } from 'react';
import { Plus, Play, Edit3, Trash2, BookOpen, Clock, Download, Upload, LogOut, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchHostQuizzes, createLiveSession, deleteQuiz, importQuiz } from '../utils/api';

export default function HostQuizListPage({ initialQuizzes = [] }) {
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [loading, setLoading] = useState(initialQuizzes.length === 0);
  const [actionLoading, setActionLoading] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);

  const config = window.__KOOZY_CONFIG__ || {};
  const user = config.user || null;

  useEffect(() => {
    fetchHostQuizzes()
      .then((data) => {
        setQuizzes(data.quizzes || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleStartSession = async (quizId) => {
    setActionLoading(quizId);
    try {
      const res = await createLiveSession(quizId);
      window.location.href = `/host/sessions/${res.session_id}/`;
    } catch (err) {
      alert(err.message || 'Failed to start live session');
      setActionLoading(null);
    }
  };

  const handleDelete = async (quizId, title) => {
    if (!window.confirm(`Are you sure you want to delete quiz "${title}"?`)) return;
    try {
      await deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      alert(err.message || 'Failed to delete quiz');
    }
  };

  const handleExport = async (quizId, title = 'quiz') => {
    try {
      const res = await fetch(`/api/host/quizzes/${quizId}/export/`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (title || 'quiz').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      a.download = `${safeName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.location.href = `/api/host/quizzes/${quizId}/export/`;
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setImportJsonText(event.target.result);
      } catch (err) {
        setImportError('Failed to read JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importJsonText.trim()) {
      setImportError('Please provide quiz JSON content or upload a .json file.');
      return;
    }

    setImporting(true);
    setImportError('');

    try {
      const parsed = JSON.parse(importJsonText);
      const res = await importQuiz(parsed);
      setShowImportModal(false);
      setImportJsonText('');
      setImporting(false);
      // Reload quizzes
      const updated = await fetchHostQuizzes();
      setQuizzes(updated.quizzes || []);
    } catch (err) {
      setImportError(err.message || 'Failed to import quiz. Verify JSON format.');
      setImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Top Navbar */}
      <nav className="flex justify-between items-center pb-6 border-b border-[#d8d3ca]">
        <a href="/" className="font-hand text-4xl text-[#191817] hover:text-[#6c4de8] transition-colors -rotate-2 select-none">
          Koozy
        </a>
        <div className="flex gap-3 sm:gap-4 items-center">
          <a href="/" className="text-sm font-semibold text-[#191817] hover:text-[#6c4de8]">
            Home
          </a>
          <a href="/join/" className="text-sm font-semibold text-[#191817] hover:text-[#6c4de8]">
            Join Room
          </a>
          <UserProfileBadge user={user} />
        </div>
      </nav>

      {/* Dashboard Topline */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-8">
        <div>
          <div className="font-hand text-2xl text-[#6c4de8] -rotate-1 select-none">
            host workspace ✦
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#191817] tracking-tight">
            Your Quizzes
          </h1>
          <p className="text-sm text-[#77736c] mt-0.5">
            {user?.name ? `Signed in as ${user.name}` : 'Manage your questions or launch an instant multiplayer session.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="kz-btn-secondary px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Upload size={16} />
            <span>Import JSON</span>
          </button>
          <a
            href="/host/quizzes/create/"
            className="kz-btn-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            <span>+ Create Quiz</span>
          </a>
        </div>
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <div className="py-20 text-center text-[#77736c] font-bold">
          Loading your quizzes...
        </div>
      ) : quizzes.length === 0 ? (
        <div className="kz-card p-12 text-center my-6 bg-white border-2 border-[#191817]">
          <div className="w-12 h-12 rounded-2xl bg-[#eeeafd] text-[#6c4de8] border-2 border-[#191817] flex items-center justify-center shadow-[3px_3px_0_#191817] mx-auto mb-4">
            <BookOpen size={24} />
          </div>
          <h3 className="text-2xl font-extrabold text-[#191817] mb-2">No quizzes created yet</h3>
          <p className="text-sm text-[#77736c] max-w-md mx-auto mb-6">
            Create your first quiz or import one from JSON to start hosting live games for your students.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="kz-btn-secondary px-5 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-1.5"
            >
              <Upload size={16} />
              <span>Import from JSON</span>
            </button>
            <a
              href="/host/quizzes/create/"
              className="kz-btn-primary px-6 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Create Quiz →</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const hasQuestions = (quiz.question_count || 0) > 0;
            const isStarting = actionLoading === quiz.id;

            return (
              <div
                key={quiz.id}
                className="kz-card p-6 bg-white border-2 border-[#191817] shadow-[3.5px_3.5px_0_#191817] rounded-3xl flex flex-col justify-between hover:border-[#6c4de8] transition-all"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="bg-[#eeeafd] text-[#6c4de8] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#c9bfff]">
                      {quiz.category || 'General'}
                    </span>
                    <span className="text-xs font-semibold text-[#77736c] capitalize">
                      {quiz.difficulty || 'Easy'}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-[#191817] line-clamp-2 mb-1.5">
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="text-xs text-[#77736c] line-clamp-2 mb-4">
                      {quiz.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs font-bold text-[#77736c] my-3">
                    <span>{quiz.question_count || 0} Questions</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      <span>{quiz.time_limit || 300}s timer</span>
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#d8d3ca] flex items-center justify-between gap-2 mt-4">
                  <button
                    onClick={() => handleStartSession(quiz.id)}
                    disabled={!hasQuestions || isStarting}
                    className="kz-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>{isStarting ? 'Launching...' : 'Host Live →'}</span>
                  </button>

                  <a
                    href={`/host/quizzes/${quiz.id}/questions/add/`}
                    className="p-2 border border-[#d8d3ca] hover:border-[#191817] rounded-xl text-[#77736c] hover:text-[#191817] transition-colors"
                    title="Edit Questions"
                  >
                    <Edit3 size={15} />
                  </a>

                  <button
                    onClick={() => handleExport(quiz.id, quiz.title)}
                    className="p-2 border border-[#d8d3ca] hover:border-[#191817] rounded-xl text-[#77736c] hover:text-[#191817] transition-colors cursor-pointer"
                    title="Export Quiz JSON"
                  >
                    <Download size={15} />
                  </button>

                  <button
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    className="p-2 border border-[#d8d3ca] hover:border-[#ff0000] hover:bg-[#fee2e2] rounded-xl text-[#77736c] hover:text-[#ff0000] transition-colors cursor-pointer"
                    title="Delete Quiz"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* JSON Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-[#191817]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="kz-card p-6 md:p-8 max-w-lg w-full bg-white border-2 border-[#191817] shadow-[6px_6px_0_#191817] rounded-3xl">
            <h3 className="text-2xl font-black text-[#191817] mb-2 flex items-center gap-2">
              <Upload size={22} className="text-[#6c4de8]" />
              <span>Import Quiz (.json)</span>
            </h3>
            <p className="text-xs text-[#77736c] mb-4">
              Upload a standard Koozy quiz JSON file or paste the JSON text below.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#191817] mb-1.5">
                  Upload .json file:
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#eeeafd] file:text-[#6c4de8] hover:file:bg-[#d8cfff] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191817] mb-1">
                  Or paste JSON directly:
                </label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{\n  "title": "Python Quiz",\n  "questions": [...]\n}'
                  rows={6}
                  className="w-full p-3 font-mono text-xs bg-[#f7f5ef] border border-[#d8d3ca] focus:border-[#6c4de8] rounded-xl outline-none resize-none"
                />
              </div>

              {importError && (
                <div className="p-3 bg-[#fee2e2] text-[#ff0000] text-xs font-bold rounded-xl border border-[#fca5a5]">
                  {importError}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportError('');
                  }}
                  className="kz-btn-secondary px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="kz-btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <span>{importing ? 'Importing...' : 'Import Quiz →'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
