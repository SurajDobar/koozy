/**
 * Koozy Quiz Background Music Manager
 *
 * Enforces:
 * - Single persistent audio instance across the session.
 * - Server WebSocket start event as source of truth.
 * - Start time synchronization across clients using server timestamp.
 * - Continuous looping while quiz is ACTIVE.
 * - Auto-stopping when quiz completes.
 * - Default 60% volume, device-local storage.
 * - Browser autoplay restrictions resilience with gesture unlock.
 */

let audioInstance = null;
let currentTrack = null;
let currentStartedAt = null;
let isPlaying = false;
let unlockRegistered = false;
const listeners = new Set();

function resolveTrackUrl(track) {
  if (!track) return '';
  if (track.startsWith('/') || track.startsWith('http')) return track;
  return `/sounds/in-game/${track}`;
}

export function getVolume() {
  if (typeof window === 'undefined') return 60;
  try {
    const saved = localStorage.getItem('koozy_music_volume');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        return parsed;
      }
    }
  } catch (e) {}
  return 60;
}

export function setVolume(vol) {
  const clamped = Math.max(0, Math.min(100, Math.round(vol)));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('koozy_music_volume', clamped.toString());
    } catch (e) {}
  }
  if (audioInstance) {
    audioInstance.volume = clamped / 100;
  }
  notifyListeners();
}

function notifyListeners() {
  const state = {
    volume: getVolume(),
    isPlaying,
    currentTrack,
  };
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {}
  });
}

export function subscribeMusic(listener) {
  listeners.add(listener);
  // Immediately emit current state
  try {
    listener({
      volume: getVolume(),
      isPlaying,
      currentTrack,
    });
  } catch (e) {}
  return () => listeners.delete(listener);
}

function calculateOffset(startedAt, duration) {
  if (!startedAt || !duration || duration <= 0) return 0;
  const startMs = new Date(startedAt).getTime();
  if (isNaN(startMs)) return 0;
  const elapsedSec = Math.max(0, (Date.now() - startMs) / 1000);
  return elapsedSec % duration;
}

function getAudioInstance() {
  if (typeof window === 'undefined') return null;
  if (!audioInstance) {
    audioInstance = new Audio();
    audioInstance.loop = true;
    audioInstance.volume = getVolume() / 100;
    audioInstance.preload = 'auto';

    audioInstance.addEventListener('play', () => {
      isPlaying = true;
      notifyListeners();
    });
    audioInstance.addEventListener('pause', () => {
      isPlaying = false;
      notifyListeners();
    });
    audioInstance.addEventListener('ended', () => {
      // Loop backup
      if (currentTrack) {
        audioInstance.play().catch(() => {});
      }
    });
  }
  return audioInstance;
}

function registerAutoplayUnlock() {
  if (unlockRegistered || typeof window === 'undefined') return;
  unlockRegistered = true;

  const unlockHandler = () => {
    if (audioInstance && currentTrack && audioInstance.paused) {
      if (audioInstance.duration && currentStartedAt) {
        audioInstance.currentTime = calculateOffset(currentStartedAt, audioInstance.duration);
      }
      audioInstance
        .play()
        .then(() => {
          isPlaying = true;
          notifyListeners();
        })
        .catch(() => {});
    }
    window.removeEventListener('click', unlockHandler, true);
    window.removeEventListener('touchstart', unlockHandler, true);
    window.removeEventListener('keydown', unlockHandler, true);
    unlockRegistered = false;
  };

  window.addEventListener('click', unlockHandler, true);
  window.addEventListener('touchstart', unlockHandler, true);
  window.addEventListener('keydown', unlockHandler, true);
}

/**
 * Start or sync background quiz music.
 * Never restarts playback from 0 if already running the requested track.
 */
export function startMusic(trackName, startedAt) {
  if (typeof window === 'undefined' || !trackName) return;
  const audio = getAudioInstance();
  if (!audio) return;

  const targetUrl = resolveTrackUrl(trackName);

  // If already playing the EXACT same track
  if (currentTrack === trackName && !audio.paused) {
    // Only resync if drifted by more than 2.5s
    if (audio.duration && startedAt) {
      const targetTime = calculateOffset(startedAt, audio.duration);
      if (Math.abs(audio.currentTime - targetTime) > 2.5) {
        audio.currentTime = targetTime;
      }
    }
    return;
  }

  currentTrack = trackName;
  currentStartedAt = startedAt;

  // If track changed or audio is stopped/not loaded yet
  const needsSourceUpdate = !audio.src || !audio.src.endsWith(targetUrl);
  if (needsSourceUpdate) {
    audio.src = targetUrl;
    audio.loop = true;
    audio.volume = getVolume() / 100;
    audio.load();
  }

  const applySyncAndPlay = () => {
    if (audio.duration && startedAt) {
      audio.currentTime = calculateOffset(startedAt, audio.duration);
    }
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying = true;
          notifyListeners();
        })
        .catch((err) => {
          console.warn('[Koozy Music] Autoplay prevented, waiting for interaction:', err);
          isPlaying = false;
          notifyListeners();
          registerAutoplayUnlock();
        });
    }
  };

  if (audio.readyState >= 1) {
    applySyncAndPlay();
  } else {
    audio.onloadedmetadata = () => {
      applySyncAndPlay();
    };
  }
}

/**
 * Stop background quiz music immediately.
 */
export function stopMusic() {
  if (typeof window === 'undefined' || !audioInstance) return;
  audioInstance.pause();
  audioInstance.currentTime = 0;
  currentTrack = null;
  currentStartedAt = null;
  isPlaying = false;
  notifyListeners();
}
