import React from 'react';
import { LogOut, WifiOff } from 'lucide-react';
import UserProfileBadge from './UserProfileBadge';
import MusicVolumeControl from './MusicVolumeControl';

export default function Navbar({ title, pin, isHost, participantName, isReconnecting, onExit, user, showMusicControl = true }) {
  const hostUser = user || window.__KOOZY_CONFIG__?.user;

  return (
    <header className="flex justify-between items-center py-4 px-6 border-b border-[#d8d3ca] bg-[#f7f5ef] max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <a href="/" className="font-hand text-4xl text-[#191817] tracking-tight hover:text-[#6c4de8] transition-colors -rotate-2 select-none">
          Koozy
        </a>
        {pin && (
          <span className="bg-[#eeeafd] text-[#6c4de8] font-bold text-xs px-2.5 py-1 rounded-lg border border-[#c9bfff] tracking-wider uppercase">
            PIN: {pin}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showMusicControl && <MusicVolumeControl />}

        {isReconnecting && (
          <div className="flex items-center gap-1.5 bg-[#fff3cd] border border-[#ffeeba] text-[#856404] px-2.5 py-1 rounded-lg text-xs font-bold animate-pulse">
            <WifiOff size={13} />
            <span>Reconnecting...</span>
          </div>
        )}

        {participantName && (
          <div className="hidden sm:flex items-center gap-2 bg-[#ffffff] border border-[#d8d3ca] px-3 py-1.5 rounded-xl shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#00cc05] animate-pulse"></span>
            <span className="text-sm font-semibold text-[#191817]">{participantName}</span>
          </div>
        )}

        {isHost && (
          <div className="flex items-center gap-2.5">
            <UserProfileBadge user={hostUser} />
          </div>
        )}

        {onExit && (
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#77736c] hover:text-[#ff0000] bg-white border border-[#d8d3ca] px-3 py-1.5 rounded-xl hover:border-[#ff0000] transition-all cursor-pointer"
            title="Leave session"
          >
            <LogOut size={14} />
            <span>Leave</span>
          </button>
        )}
      </div>
    </header>
  );
}
