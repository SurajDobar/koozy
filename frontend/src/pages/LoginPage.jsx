import React, { useState } from 'react';
import { ArrowLeft, Sparkles, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = (e) => {
    e.preventDefault();
    setLoading(true);
    const teacherEmail = email.trim() || 'teacher@koozy.edu';
    const teacherName = name.trim() || 'Teacher';
    window.location.href = `/auth/google/?email=${encodeURIComponent(teacherEmail)}&name=${encodeURIComponent(teacherName)}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 min-h-[90vh] flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="flex justify-between items-center pb-6 border-b border-[#d8d3ca]">
        <a href="/" className="font-hand text-4xl text-[#191817] hover:text-[#6c4de8] transition-colors -rotate-2 select-none">
          Koozy
        </a>
        <a
          href="/"
          className="kz-btn-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Home</span>
        </a>
      </nav>

      <div className="my-auto flex flex-col items-center justify-center text-center p-4">
        <div className="inline-block font-hand text-3xl text-[#6c4de8] -rotate-2 mb-2 select-none">
          educator workspace ✦
        </div>

        <div className="kz-card p-8 md:p-10 max-w-md w-full bg-[#fffdf7] border-2 border-[#191817] shadow-[4px_4px_0_#191817] rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-[#eeeafd] text-[#6c4de8] border-2 border-[#191817] flex items-center justify-center shadow-[3px_3px_0_#191817] mx-auto mb-4">
            <LogIn size={24} />
          </div>

          <h1 className="text-3xl font-black text-[#191817] mb-1">
            Teacher Sign In
          </h1>
          <p className="text-sm text-[#77736c] mb-6">
            Sign in with Google to create, manage, and host your live classroom quizzes.
          </p>

          <form onSubmit={handleGoogleSignIn} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#77736c] mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Prof. Davis"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border-2 border-[#d8d3ca] focus:border-[#6c4de8] rounded-xl text-sm font-semibold outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#77736c] mb-1">
                Google / School Email
              </label>
              <input
                type="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border-2 border-[#d8d3ca] focus:border-[#6c4de8] rounded-xl text-sm font-semibold outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="kz-btn-primary w-full py-3.5 rounded-xl font-bold text-sm cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {/* Google G Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loading ? 'Authenticating...' : 'Sign in with Google →'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#d8d3ca] text-xs text-[#77736c]">
            Students join as guests at <a href="/join/" className="font-bold text-[#6c4de8] hover:underline">/join/</a> without an account.
          </div>
        </div>
      </div>

      <footer className="pt-6 border-t border-[#d8d3ca] text-center text-xs text-[#77736c]">
        Koozy — Classroom Learning Play
      </footer>
    </div>
  );
}
