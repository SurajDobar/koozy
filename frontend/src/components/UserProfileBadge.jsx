import React, { useState, useRef, useEffect } from 'react';
import { LogOut, BookOpen, PlusCircle, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function UserProfileBadge({ user = null }) {
  const config = typeof window !== 'undefined' ? (window.__KOOZY_CONFIG__ || {}) : {};
  const activeUser = user || config.user || null;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!activeUser || !activeUser.is_authenticated) {
    return (
      <a
        href="/auth/login/"
        className="flex items-center gap-2 bg-white border border-[#d8d3ca] hover:border-[#6c4de8] text-[#191817] hover:text-[#6c4de8] px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Host Sign In</span>
      </a>
    );
  }

  const displayName = activeUser.name || activeUser.email?.split('@')[0] || 'Host';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Google Profile Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-white border border-[#d8d3ca] hover:border-[#6c4de8] pl-1.5 pr-3 py-1 rounded-full shadow-xs hover:shadow-sm transition-all cursor-pointer select-none group"
        title="Google Account"
        aria-expanded={isOpen}
      >
        {activeUser.avatar_url ? (
          <img
            src={activeUser.avatar_url}
            alt={displayName}
            className="w-7 h-7 rounded-full object-cover border border-[#d8d3ca] group-hover:border-[#6c4de8] transition-colors"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#eeeafd] text-[#6c4de8] text-xs font-bold flex items-center justify-center border border-[#c9bfff]">
            {initial}
          </div>
        )}

        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-[#191817] group-hover:text-[#6c4de8] transition-colors max-w-[120px] truncate leading-tight">
            {displayName}
          </span>
          <span className="text-[10px] text-[#77736c] leading-none">Host</span>
        </div>

        <ChevronDown
          size={14}
          className={`text-[#77736c] group-hover:text-[#6c4de8] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Google Account Dropdown Flyout Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border-2 border-[#191817] shadow-[4px_4px_0px_#191817] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Card Header with Google branding */}
          <div className="bg-[#f7f5ef] px-4 py-3 border-b border-[#d8d3ca] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-[11px] font-bold tracking-wide text-[#77736c] uppercase">Google Account</span>
            </div>
            <span className="bg-[#eeeafd] text-[#6c4de8] font-bold text-[10px] px-2 py-0.5 rounded-full border border-[#c9bfff]">
              Host Active
            </span>
          </div>

          {/* User Details */}
          <div className="p-4 flex flex-col items-center text-center">
            <div className="relative mb-3">
              {activeUser.avatar_url ? (
                <img
                  src={activeUser.avatar_url}
                  alt={displayName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#191817] shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#6c4de8] text-white text-xl font-extrabold flex items-center justify-center border-2 border-[#191817] shadow-xs">
                  {initial}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-[#00cc05] text-white p-0.5 rounded-full border-2 border-white" title="Logged in">
                <CheckCircle2 size={12} className="stroke-[3]" />
              </div>
            </div>

            <h3 className="font-extrabold text-[#191817] text-base leading-tight">
              {displayName}
            </h3>
            {activeUser.email && (
              <p className="text-xs text-[#77736c] font-medium mt-0.5 truncate max-w-[220px]">
                {activeUser.email}
              </p>
            )}
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-2 border-t border-[#d8d3ca] flex flex-col gap-1 bg-[#fcfbfa]">
            <a
              href="/host/quizzes/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#191817] hover:bg-[#eeeafd] hover:text-[#6c4de8] transition-colors"
            >
              <BookOpen size={15} />
              <span>My Quiz Library</span>
            </a>
            <a
              href="/host/quizzes/create"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#191817] hover:bg-[#eeeafd] hover:text-[#6c4de8] transition-colors"
            >
              <PlusCircle size={15} />
              <span>Create New Quiz</span>
            </a>
          </div>

          {/* Sign Out Footer */}
          <div className="p-3 border-t border-[#d8d3ca] bg-white">
            <a
              href="/auth/logout/"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#d8d3ca] hover:border-[#ff0000] text-xs font-bold text-[#77736c] hover:text-[#ff0000] hover:bg-[#fff5f5] transition-all"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
