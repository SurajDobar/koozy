import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Volume1, VolumeX, Music } from 'lucide-react';
import { getVolume, setVolume, subscribeMusic } from '../utils/bgMusic';

export default function MusicVolumeControl({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [musicState, setMusicState] = useState({
    volume: getVolume(),
    isPlaying: false,
    currentTrack: null,
  });
  const [prevVolume, setPrevVolume] = useState(60);
  const popoverRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeMusic((state) => {
      setMusicState(state);
    });
    return unsubscribe;
  }, []);

  // Click outside and Escape key handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
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

  const volume = musicState.volume;

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
  };

  const handleToggleMute = (e) => {
    e.stopPropagation();
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume > 0 ? prevVolume : 60);
    }
  };

  // Speaker icon based on volume level
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={popoverRef}>
      {/* Speaker trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer select-none ${
          isOpen
            ? 'bg-[#eeeafd] border-[#6c4de8] text-[#6c4de8] shadow-[2px_2px_0_#191817]'
            : 'bg-white border-[#d8d3ca] text-[#191817] hover:border-[#191817] hover:bg-[#faf9f5]'
        }`}
        title={volume === 0 ? 'Quiz Music: Muted' : `Quiz Music: ${volume}%`}
        aria-label="Quiz music volume"
        data-sfx="tick"
      >
        <VolumeIcon size={16} className={musicState.isPlaying ? 'animate-pulse text-[#6c4de8]' : ''} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-[#191817] shadow-[4px_4px_0_#191817] rounded-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#e5e1d8]">
            <div className="flex items-center gap-2">
              <Music size={14} className="text-[#6c4de8]" />
              <span className="text-xs font-black text-[#191817]">Quiz Music</span>
            </div>
            <span className="text-xs font-mono font-bold bg-[#eeeafd] text-[#6c4de8] px-2 py-0.5 rounded-lg border border-[#c9bfff]">
              {volume}%
            </span>
          </div>

          {/* Slider Row */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleMute}
              className="text-[#77736c] hover:text-[#191817] transition-colors cursor-pointer shrink-0"
              title={volume === 0 ? 'Unmute' : 'Mute'}
              data-sfx="tick"
            >
              <VolumeIcon size={16} />
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleSliderChange}
              className="w-full h-2 bg-[#e5e1d8] rounded-lg appearance-none cursor-pointer accent-[#6c4de8] focus:outline-none"
              aria-label="Volume slider"
            />
          </div>

          {/* Footer status / track label */}
          <div className="mt-3 pt-2 border-t border-[#f0ede6] flex items-center justify-between text-[10px] text-[#77736c] font-semibold">
            <span>{volume === 0 ? 'Muted' : musicState.isPlaying ? 'Playing' : 'Ready'}</span>
            {musicState.currentTrack && (
              <span className="font-mono text-[#6c4de8] uppercase">
                {musicState.currentTrack.replace('.mp3', '')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
