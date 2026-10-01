/**
 * Cloudflare Worker for Koozy (Frontend & Reverse Proxy).
 *
 * Serves Astro static assets from dist-astro via env.ASSETS.
 * Reverse-proxies dynamic requests (/api/*, /auth/google/*, /auth/logout*, /ws/*, /admin/*)
 * to the Django + Daphne ASGI backend on Render.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Backend route definitions matching Django & Daphne ASGI routes
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

    if (isBackendRoute) {
      const backendOrigin = (env.BACKEND_URL || 'https://koozy-backend.onrender.com').replace(/\/$/, '');
      const targetUrl = new URL(pathname + url.search, backendOrigin);

      // Handle WebSockets (Daphne Channels live sessions)
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

    // Serve Astro static pages and assets from ./dist-astro
    return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
  },
};
