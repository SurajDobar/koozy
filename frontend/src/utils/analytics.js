/**
 * Safe GA4 Product Event Tracker for Koozy.
 * Reuses the existing Google Analytics 4 (gtag) setup without adding extra libraries.
 *
 * Requirements:
 * - Never throw or interrupt Koozy if gtag is blocked or unavailable (e.g. adblockers).
 * - Never collect personal identifying info (names, emails) or quiz content (questions, answers).
 * - Deduplicate events to prevent re-firing on React re-renders or WebSocket reconnects.
 */

const firedEventsCache = new Set();

/**
 * Track a product event in GA4 via the existing gtag instance.
 *
 * @param {string} eventName - Standard or custom event name (e.g., 'quiz_created')
 * @param {Object} [params={}] - Optional event parameters (numbers, counts, booleans only)
 * @param {string} [dedupKey=null] - Optional unique key to guarantee the event fires at most once per key
 */
export function trackEvent(eventName, params = {}, dedupKey = null) {
  if (typeof window === 'undefined') return;

  if (dedupKey) {
    if (firedEventsCache.has(dedupKey)) {
      return;
    }
    firedEventsCache.add(dedupKey);
  }

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    } else if (Array.isArray(window.dataLayer)) {
      // Direct dataLayer fallback if gtag function wrapper isn't initialized yet
      window.dataLayer.push({
        event: eventName,
        ...params,
      });
    }
  } catch (err) {
    // Non-blocking: analytics should never break gameplay or user experience
  }
}

/**
 * 1. quiz_created
 * Fired only when a quiz is successfully created or imported into the host's library.
 *
 * @param {Object} [data={}]
 * @param {number|string} [data.quizId] - Optional internal ID for deduplication
 * @param {number} [data.questionCount] - Number of questions (if known)
 * @param {string} [data.method] - 'manual' | 'ai' | 'import'
 */
export function trackQuizCreated({ quizId, questionCount, method = 'manual' } = {}) {
  const dedupKey = quizId ? `quiz_created_${quizId}` : null;
  const params = {
    method,
  };
  if (typeof questionCount === 'number') {
    params.question_count = questionCount;
  }
  trackEvent('quiz_created', params, dedupKey);
}

/**
 * 2. quiz_started
 * Fired only when a live multiplayer quiz session transitions to ACTIVE (quiz has started).
 *
 * @param {string} gamePin - 5-letter session PIN for deduplication
 * @param {Object} [data={}]
 * @param {number} [data.participantCount]
 * @param {number} [data.totalTimeLimit]
 */
export function trackQuizStarted(gamePin, { participantCount, totalTimeLimit } = {}) {
  if (!gamePin) return;
  const dedupKey = `quiz_started_${gamePin.toUpperCase()}`;
  const params = {};
  if (typeof participantCount === 'number') {
    params.participant_count = participantCount;
  }
  if (typeof totalTimeLimit === 'number') {
    params.total_time_limit = totalTimeLimit;
  }
  trackEvent('quiz_started', params, dedupKey);
}

/**
 * 3. player_joined
 * Fired only when a player successfully joins a live quiz room (join API success).
 *
 * @param {string} gamePin - 5-letter room PIN
 * @param {string|number} [joinTokenOrId] - Token or ID to prevent duplicates on tab re-renders
 */
export function trackPlayerJoined(gamePin, joinTokenOrId) {
  if (!gamePin) return;
  const dedupKey = joinTokenOrId
    ? `player_joined_${gamePin.toUpperCase()}_${joinTokenOrId}`
    : `player_joined_${gamePin.toUpperCase()}_${Date.now()}`;
  trackEvent('player_joined', {}, dedupKey);
}

/**
 * 4. quiz_completed
 * Fired only when a live quiz session reaches COMPLETED status (ended by host, timer, or completion).
 *
 * @param {string} gamePin - 5-letter room PIN for deduplication
 * @param {Object} [data={}]
 * @param {number} [data.questionCount]
 * @param {number} [data.participantCount]
 */
export function trackQuizCompleted(gamePin, { questionCount, participantCount } = {}) {
  if (!gamePin) return;
  const dedupKey = `quiz_completed_${gamePin.toUpperCase()}`;
  const params = {};
  if (typeof questionCount === 'number') {
    params.question_count = questionCount;
  }
  if (typeof participantCount === 'number') {
    params.participant_count = participantCount;
  }
  trackEvent('quiz_completed', params, dedupKey);
}

/**
 * 5. ai_quiz_generated
 * Fired only when the Gemini AI quiz generator successfully returns a generated quiz.
 *
 * @param {Object} [data={}]
 * @param {number|string} [data.quizId] - Generated quiz ID for deduplication
 * @param {number} [data.questionCount] - Number of generated questions requested/returned
 */
export function trackAIQuizGenerated({ quizId, questionCount } = {}) {
  const dedupKey = quizId ? `ai_quiz_generated_${quizId}` : null;
  const params = {};
  if (typeof questionCount === 'number') {
    params.question_count = questionCount;
  }
  trackEvent('ai_quiz_generated', params, dedupKey);
}
