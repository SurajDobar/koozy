/**
 * Cloudflare Pages Functions - Production Reverse Proxy for Koozy.
 *
 * Seamlessly bridges the Astro frontend (Cloudflare Pages at koozy.live)
 * to the Django + Daphne ASGI backend (Render at koozy-backend.onrender.com).
 *
 * Supported features:
 * - REST API endpoints (/api/*)
 * - Google OAuth initiation & callback (/auth/google/*)
 * - Host logout (/auth/logout/)
 * - Realtime WebSockets for live quizzes (/ws/*)
 * - Django Admin (/admin/*) and static assets (/static/*)
 * - Preserves session cookies, CSRF tokens, and forwarded headers
 * - Passes through static Astro presentation/SEO pages
 */

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Paths that route to the Django / Daphne ASGI backend
  const isBackendRoute =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/google') ||
    pathname === '/auth/logout' ||
    pathname === '/auth/logout/' ||
    pathname.startsWith('/ws/') ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/static/admin/') ||
    pathname.startsWith('/static/rest_framework/') ||
    pathname.startsWith('/host/sessions/') ||
    pathname.startsWith('/dev/') ||
    /^\/host\/quizzes\/\d+\/questions(\/|$)/.test(pathname) ||
    /^\/join\/[A-Za-z0-9]{5}(\/|$)/.test(pathname);

  // If not a backend route, let Cloudflare Pages serve static Astro assets
  if (!isBackendRoute) {
    return next();
  }

  // Target Render backend origin (configurable via Cloudflare Pages env variable BACKEND_URL)
  const backendOrigin = (env.BACKEND_URL || 'https://koozy-backend.onrender.com').replace(/\/$/, '');
  const targetUrl = new URL(pathname + url.search, backendOrigin);

  // Handle WebSocket connections (for live multiplayer quiz lobby and gameplay)
  const upgradeHeader = request.headers.get('Upgrade')?.toLowerCase();
  if (upgradeHeader === 'websocket') {
    const wsTarget = new URL(pathname + url.search, backendOrigin);
    wsTarget.protocol = 'https:';
    return fetch(wsTarget.toString(), request);
  }

  // Handle standard HTTP requests (API, OAuth, Admin)
  const proxyReq = new Request(targetUrl.toString(), request);
  proxyReq.headers.set('X-Forwarded-Host', url.host);
  proxyReq.headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

  // Use redirect: 'manual' so that 302 redirects (e.g. Google OAuth redirect) are returned to the browser
  return fetch(proxyReq, { redirect: 'manual' });
}
