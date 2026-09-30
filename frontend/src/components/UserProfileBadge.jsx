import React, { useState, useRef, useEffect } from 'react';
import { LogOut, BookOpen, PlusCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function UserProfileBadge({ user = null }) {
  const config = typeof window !== 'undefined' ? (window.__KOOZY_CONFIG__ || {}) : {};
  const [activeUser, setActiveUser] = useState(user || config.user || null);
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef(null);

  // Sync prop changes
  useEffect(() => {
    if (user) {
      setActiveUser(user);
    }
  }, [user]);

  // Gracefully hydrate auth state in Astro / static islands where config.user is not preloaded
  useEffect(() => {
    if (!user && !config.user && typeof window !== 'undefined') {
      fetch('/api/auth/me/')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.is_authenticated && data.user) {
            setActiveUser(data.user);
          }
        })
        .catch(() => {});
    }
  }, [user, config.user]);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!activeUser || !activeUser.is_authenticated) {
    return (
      <a
        href="/auth/login/"
        className="flex items-center gap-2 bg-white border-2 border-[#191817] hover:bg-[#eeeafd] hover:border-[#6c4de8] text-[#191817] px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-[2px_2px_0px_#191817] hover:shadow-[3px_3px_0px_#191817] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_#191817] transition-all"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Host Login</span>
      </a>
    );
  }

  const displayName = activeUser.name || activeUser.email?.split('@')[0] || 'Host';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Google-Style Circular Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group p-0.5 rounded-full border-2 border-[#191817] shadow-[2px_2px_0px_#191817] hover:shadow-[3px_3px_0px_#6c4de8] hover:border-[#6c4de8] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_#191817] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6c4de8] focus:ring-offset-2 select-none"
        title={`Google Account: ${displayName} (${activeUser.email || ''})`}
        aria-expanded={isOpen}
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#eeeafd]">
          {activeUser.avatar_url && !imgError ? (
            <img
              src={activeUser.avatar_url}
              alt={displayName}
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-[#6c4de8] text-white text-sm sm:text-base font-black flex items-center justify-center">
              {initial}
            </div>
          )}
        </div>

        {/* Mini Active Online Indicator Dot */}
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00cc05] border-2 border-white rounded-full shadow-xs" title="Logged in with Google"></span>
      </button>

      {/* Google Account Dropdown Flyout Card in Koozy Aesthetic */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-88 bg-[#ffffff] rounded-3xl border-3 border-[#191817] shadow-[6px_6px_0px_#191817] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Top Google & Status Header */}
          <div className="bg-[#f7f5ef] px-5 py-3 border-b-2 border-[#191817] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-[11px] font-black tracking-wider text-[#191817] uppercase">Google Account</span>
            </div>
            <span className="bg-[#00cc05]/15 text-[#008a03] font-black text-[11px] px-2.5 py-0.5 rounded-full border border-[#00cc05]/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00cc05] animate-pulse"></span>
              Host Online
            </span>
          </div>

          {/* User Large Avatar & Details */}
          <div className="p-6 flex flex-col items-center text-center bg-[#fffdf7]">
            <div className="relative mb-3.5">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-3 border-[#191817] shadow-[3px_3px_0px_#191817] overflow-hidden bg-[#eeeafd]">
                {activeUser.avatar_url && !imgError ? (
                  <img
                    src={activeUser.avatar_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-[#6c4de8] text-white text-2xl font-black flex items-center justify-center">
                    {initial}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#00cc05] text-white p-1 rounded-full border-2 border-[#191817] shadow-xs" title="Verified Host">
                <CheckCircle2 size={14} className="stroke-[3]" />
              </div>
            </div>

            <h3 className="font-black text-[#191817] text-lg sm:text-xl leading-tight">
              {displayName}
            </h3>
            {activeUser.email && (
              <p className="text-xs text-[#77736c] font-semibold mt-1 px-3 py-1 bg-[#f7f5ef] rounded-full border border-[#d8d3ca] max-w-[240px] truncate">
                {activeUser.email}
              </p>
            )}

            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#6c4de8] bg-[#eeeafd] px-3 py-1 rounded-xl border border-[#c9bfff]">
              <ShieldCheck size={13} />
              <span>Verified Teacher / Host</span>
            </div>
          </div>

          {/* Quick Host Navigation */}
          <div className="p-3 border-t-2 border-[#191817] bg-[#ffffff] space-y-1.5">
            <a
              href="/host/quizzes/"
              className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-black text-[#191817] hover:bg-[#eeeafd] hover:text-[#6c4de8] border border-transparent hover:border-[#6c4de8] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} />
                <span>My Quiz Library</span>
              </div>
              <span className="text-[10px] text-[#77736c] font-bold">Dashboard →</span>
            </a>
            <a
              href="/host/quizzes/create/"
              className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-black text-[#191817] hover:bg-[#eeeafd] hover:text-[#6c4de8] border border-transparent hover:border-[#6c4de8] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle size={16} />
                <span>Create New Quiz</span>
              </div>
              <span className="text-[10px] text-[#6c4de8] font-bold">+ New</span>
            </a>
          </div>

          {/* Sign Out Action Button */}
          <div className="p-4 border-t-2 border-[#191817] bg-[#f7f5ef]">
            <a
              href="/auth/logout/"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white border-2 border-[#191817] text-xs font-black text-[#ff0000] shadow-[2px_2px_0px_#191817] hover:shadow-[3px_3px_0px_#ff0000] hover:border-[#ff0000] hover:bg-[#fff5f5] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_#191817] transition-all"
            >
              <LogOut size={15} />
              <span>Sign Out of Google Account</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

