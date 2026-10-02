/**
 * Koozy SFX Sound Manager
 * Preloads and manages all 15 game sound effects with low-latency Web Audio API
 * and HTML5 Audio fallback. Eliminates first-interaction silence/bugs.
 */

export const SOUND_FILES = {
  // 1. Backward swish: left button to go behind questions
  'backward-swish': '/sounds/backward-swish.mp3',
  'backwars-swish': '/sounds/backward-swish.mp3',
  backward: '/sounds/backward-swish.mp3',

  // 2. Choose answer pop button: option buttons A, B, C, D
  'choose-answer-pop-button': '/sounds/choose-answer-pop-button-sfx.mp3',
  'choose-answer-pop-button-sfx': '/sounds/choose-answer-pop-button-sfx.mp3',
  'choose-answer': '/sounds/choose-answer-pop-button-sfx.mp3',
  option: '/sounds/choose-answer-pop-button-sfx.mp3',

  // 3. Error hard: login failed, AI quiz generation failed
  'error2_harrd': '/sounds/error2_harrd.mp3',
  'error2_hardd': '/sounds/error2_harrd.mp3',
  errorHard: '/sounds/error2_harrd.mp3',

  // 4. Forward swish: right button to go forward questions
  'forward-swish': '/sounds/forward-swish.mp3',
  forward: '/sounds/forward-swish.mp3',

  // 5. Koozy button: mechanical buttons that press down
  'koozy-button': '/sounds/koozy-button.mp3',
  button: '/sounds/koozy-button.mp3',

  // 6. Koozy connect: connect in live session like Google Meet
  'koozy-connect': '/sounds/koozy-connect.mp3',
  connect: '/sounds/koozy-connect.mp3',

  // 7. Koozy disconnect: disconnect out of live session
  'koozy-disconnect': '/sounds/koozy-disconnect.mp3',
  disconnect: '/sounds/koozy-disconnect.mp3',

  // 8. Koozy error: subtle warning like ending quiz are u sure
  'koozy-error': '/sounds/koozy-error.mp3',
  warning: '/sounds/koozy-error.mp3',
  error: '/sounds/koozy-error.mp3',

  // 9. Koozy loose: below 50% accuracy in results
  'koozy-loose': '/sounds/Koozy-loose.mp3',
  loose: '/sounds/Koozy-loose.mp3',
  lose: '/sounds/Koozy-loose.mp3',

  // 10. Koozy submitted: submitting the quiz
  'koozy-submitted': '/sounds/koozy-submitted.mp3',
  submitted: '/sounds/koozy-submitted.mp3',

  // 11. Koozy success: AI generated quiz, general good event
  'koozy-success': '/sounds/koozy-success.mp3',
  success: '/sounds/koozy-success.mp3',

  // 12. Koozy unsuccess: task failed, banned, subtle failure
  'koozy-unsucess': '/sounds/koozy-unsucess.mp3',
  'koozy-unsuccess': '/sounds/koozy-unsucess.mp3',
  unsuccess: '/sounds/koozy-unsucess.mp3',

  // 13. Koozy win: above 50% accuracy or leaderboard win
  'koozy-win': '/sounds/Koozy-win.mp3',
  win: '/sounds/Koozy-win.mp3',

  // 14. Tick immersive: subtle small buttons like time adjustment
  'tick-immersive': '/sounds/tick-immersive.mp3',
  tick: '/sounds/tick-immersive.mp3',

  // 15. URL: played for every URL clicked
  'url.mp3': '/sounds/url.mp3',
  url: '/sounds/url.mp3',
};

// Distinct unique URLs to fetch and decode
const UNIQUE_SOUND_URLS = [
  ...new Set(Object.values(SOUND_FILES)),
];

let audioCtx = null;
const audioBuffers = new Map();
const audioElements = new Map();
let isAudioUnlocked = false;
let isPreloaded = false;

/**
 * Returns or initializes the shared AudioContext safely in browser environments.
 */
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Browser user-gesture unlocker.
 * Wakes up AudioContext on the first click/touch anywhere so sounds play immediately without delays.
 */
export function unlockAudio() {
  if (isAudioUnlocked) return;
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Play a 1-sample silent buffer to unlock iOS Safari & Chrome WebAudio
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {}
  }
  isAudioUnlocked = true;
}

/**
 * Preload all sounds into memory beforehand so zero latency or network delay occurs during gameplay.
 */
export async function preloadAudio() {
  if (typeof window === 'undefined' || isPreloaded) return;
  isPreloaded = true;

  const ctx = getAudioContext();

  // 1. Preload HTMLAudio elements as warm network & playback fallback
  for (const url of UNIQUE_SOUND_URLS) {
    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      audio.load();
      audioElements.set(url, audio);
    } catch (e) {}
  }

  // 2. Decode into Web Audio API buffers for zero-latency instant multi-channel firing
  if (ctx) {
    for (const url of UNIQUE_SOUND_URLS) {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then((arrayBuf) => ctx.decodeAudioData(arrayBuf))
        .then((decodedBuf) => {
          audioBuffers.set(url, decodedBuf);
        })
        .catch(() => {
          // If fetch or decode fails, HTMLAudioElement fallback remains ready
        });
    }
  }
}

/**
 * Play a sound effect by name or filename.
 * @param {string} soundName - e.g. 'backward-swish', 'choose-answer-pop-button', 'koozy-button', etc.
 * @param {object} options - { volume: 0.0 - 1.0, rate: playbackRate }
 */
export function playSfx(soundName, { volume = 1.0, rate = 1.0 } = {}) {
  if (typeof window === 'undefined') return;

  const url = SOUND_FILES[soundName] || SOUND_FILES[soundName.toLowerCase()] || soundName;
  if (!url) return;

  // Ensure AudioContext is awakened
  unlockAudio();
  const ctx = getAudioContext();

  // 1. Primary engine: Pre-decoded Web Audio API buffer (instant 0ms response)
  if (ctx && audioBuffers.has(url)) {
    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const buffer = audioBuffers.get(url);
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();

      source.buffer = buffer;
      source.playbackRate.value = rate;
      gainNode.gain.value = Math.max(0, Math.min(1, volume));

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
      return;
    } catch (err) {
      // Fall through to HTMLAudioElement on any glitch
    }
  }

  // 2. Fallback engine: Preloaded HTMLAudioElement
  try {
    let audio = audioElements.get(url);
    if (!audio) {
      audio = new Audio(url);
      audioElements.set(url, audio);
    }
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.playbackRate = rate;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  } catch (err) {}
}

/**
 * Plays a sound and safely performs navigation after a short delay so the sound plays in full.
 */
export function playSfxAndNavigate(soundName, destinationUrl, delay = 400) {
  playSfx(soundName);
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.location.href = destinationUrl;
    }, delay);
  }
}

// Auto-register global link and mechanical button sound listeners in the browser
if (typeof window !== 'undefined') {
  const attachListeners = () => {
    preloadAudio();

    const unlockHandler = () => {
      unlockAudio();
    };
    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });

    // Global click listener for links (url.mp3) and mechanical buttons (koozy-button)
    document.addEventListener('click', (e) => {
      // 1. Check if clicked an anchor link or inside one
      const link = e.target.closest('a[href]');
      if (link) {
        if (link.hasAttribute('data-sfx-special')) return;

        // Check if this is a micro link (small icon link, data-sfx="tick", or icon-only)
        const isMicro =
          link.matches('[data-sfx="tick"], [data-sfx="tick-immersive"], [data-micro]') ||
          (link.querySelector('svg') && !link.textContent.trim()) ||
          (link.offsetWidth > 0 && link.offsetWidth <= 44 && link.offsetHeight <= 44);

        // Check if this link is styled as a big mechanical tactile button
        const isMechanical = !isMicro && link.matches('.kz-btn-primary, .kz-btn-secondary, [data-sfx="koozy-button"], [data-sfx="button"]');
        
        let soundName = 'url';
        if (isMicro) {
          soundName = 'tick-immersive';
        } else if (isMechanical) {
          soundName = 'koozy-button';
        }

        const href = link.getAttribute('href');
        const isDownload =
          link.hasAttribute('download') ||
          (href && (href.startsWith('blob:') || href.startsWith('data:')));

        // If it is a file download or blob/data URI, trigger sfx without preventDefault or navigation
        if (isDownload) {
          playSfx(isMicro ? 'tick-immersive' : 'url');
          return;
        }

        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          // Standard left-click without modifier keys and not opening a new tab
          if (
            !e.ctrlKey &&
            !e.metaKey &&
            !e.shiftKey &&
            !e.altKey &&
            e.button === 0 &&
            link.target !== '_blank' &&
            !href.startsWith('mailto:') &&
            !href.startsWith('tel:')
          ) {
            e.preventDefault();
            playSfx(soundName);
            setTimeout(() => {
              window.location.href = link.href || href;
            }, isMechanical ? 180 : 150);
            return;
          }
        }
        playSfx(soundName);
        return;
      }

      // 2. Check if clicked a BIG mechanical tactile button (specifically .kz-btn-primary / .kz-btn-secondary)
      // Do NOT trigger on generic <button> tags or subtle controls
      const mechanicalBtn = e.target.closest('.kz-btn-primary, .kz-btn-secondary, [data-sfx="koozy-button"], [data-sfx="button"]');
      if (mechanicalBtn) {
        if (mechanicalBtn.hasAttribute('data-sfx-special')) return;
        playSfx('koozy-button');
        return;
      }

      // 3. Subtle / Micro buttons (time adjustments, icon buttons, counters, small toggles)
      const microBtn = e.target.closest('button, [role="button"], [data-sfx="tick"], [data-sfx="tick-immersive"]');
      if (microBtn) {
        if (microBtn.hasAttribute('data-sfx-special')) return;
        const isMicro =
          microBtn.matches('[data-sfx="tick"], [data-sfx="tick-immersive"], [data-micro]') ||
          (microBtn.querySelector('svg') && !microBtn.textContent.trim()) ||
          (microBtn.offsetWidth > 0 && microBtn.offsetWidth <= 44 && microBtn.offsetHeight <= 44);

        if (isMicro) {
          playSfx('tick-immersive');
          return;
        }
      }
    }, true);
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', attachListeners);
  } else {
    attachListeners();
  }
}
