/**
 * Cloudflare Worker for Koozy (Frontend & Reverse Proxy).
 *
 * Serves Astro static assets from dist-astro via env.ASSETS.
 * Reverse-proxies dynamic requests (/api/*, /auth/google/*, /auth/logout*, /ws/*, /admin/*, /host/sessions/*, /static/*)
 * to the Django + Daphne ASGI backend on Render.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();

    // 1. Enforce HTTPS and apex domain (https://koozy.live) in a single 301 Permanent Redirect
    const isWww = hostname === 'www.koozy.live';
    const isHttp = url.protocol === 'http:' && !hostname.includes('localhost') && !hostname.includes('127.0.0.1');

    if (isWww || isHttp) {
      const canonicalHostname = isWww ? 'koozy.live' : hostname;
      const canonicalUrl = `https://${canonicalHostname}${url.pathname}${url.search}`;
      return Response.redirect(canonicalUrl, 301);
    }

    const pathname = url.pathname;

    // Backend route definitions matching Django & Daphne ASGI routes
    const isBackendRoute =
      pathname === '/api' ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/auth/google') ||
      pathname.startsWith('/auth/logout') ||
      pathname.startsWith('/ws/') ||
      pathname === '/admin' ||
      pathname.startsWith('/admin/') ||
      pathname.startsWith('/static/quiz/') ||
      pathname.startsWith('/static/admin/') ||
      pathname.startsWith('/static/rest_framework/') ||
      pathname.startsWith('/static/') ||
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

      // 1. Forward request headers, stripping hop-by-hop headers
      const forwardHeaders = new Headers();
      for (const [key, value] of request.headers.entries()) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey === 'host' ||
          lowerKey === 'connection' ||
          lowerKey === 'keep-alive' ||
          lowerKey === 'transfer-encoding'
        ) {
          continue;
        }
        forwardHeaders.set(key, value);
      }

      // Explicitly preserve client Cookie header
      const clientCookie = request.headers.get('cookie');
      if (clientCookie) {
        forwardHeaders.set('cookie', clientCookie);
      }

      // Add proxy identity headers for Django
      forwardHeaders.set('X-Forwarded-Host', url.host);
      forwardHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

      // 2. Safely buffer request body for methods that support bodies
      let requestBody = null;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        requestBody = await request.arrayBuffer();
      }

      const fetchInit = {
        method: request.method,
        headers: forwardHeaders,
        redirect: 'manual',
      };
      if (requestBody && requestBody.byteLength > 0) {
        fetchInit.body = requestBody;
      }

      // 3. Perform subrequest to Render backend
      const backendResponse = await fetch(targetUrl.toString(), fetchInit);

      // 4. Construct clean response headers
      const responseHeaders = new Headers(backendResponse.headers);

      // Remove hop-by-hop headers that trigger ERR_QUIC_PROTOCOL_ERROR / ERR_HTTP2_PROTOCOL_ERROR in browsers
      responseHeaders.delete('connection');
      responseHeaders.delete('keep-alive');
      responseHeaders.delete('transfer-encoding');
      responseHeaders.delete('proxy-connection');

      // Preserve and sanitize all Set-Cookie headers cleanly
      let setCookies = [];
      if (typeof backendResponse.headers.getSetCookie === 'function') {
        setCookies = backendResponse.headers.getSetCookie();
      }
      if ((!setCookies || setCookies.length === 0) && backendResponse.headers.has('set-cookie')) {
        const raw = backendResponse.headers.get('set-cookie');
        if (raw) setCookies = [raw];
      }

      if (setCookies && setCookies.length > 0) {
        responseHeaders.delete('Set-Cookie');
        for (const cookie of setCookies) {
          // Strip any internal backend domain (.onrender.com) so the browser accepts the cookie
          let sanitized = cookie.replace(/Domain=[^;]+;?\s*/gi, '').trim();

          // Bind cookie to .koozy.live for production persistence across koozy.live and subdomains
          if (url.hostname.includes('koozy.live')) {
            sanitized = sanitized.replace(/;?\s*$/, '; Domain=.koozy.live');
          }
          if (!/;\s*Path=/i.test(sanitized)) {
            sanitized = sanitized.replace(/;?\s*$/, '; Path=/');
          }
          if (!/;\s*SameSite=/i.test(sanitized)) {
            sanitized = sanitized.replace(/;?\s*$/, '; SameSite=Lax');
          }
          if (url.protocol === 'https:' && !/;\s*Secure/i.test(sanitized)) {
            sanitized = sanitized.replace(/;?\s*$/, '; Secure');
          }
          responseHeaders.append('Set-Cookie', sanitized);
        }
      }

      // Rewrite Location header if backend redirected using internal Render URL or plain HTTP
      const location = responseHeaders.get('Location');
      if (location) {
        let rewrittenLocation = location;
        if (rewrittenLocation.startsWith(backendOrigin)) {
          rewrittenLocation = rewrittenLocation.replace(backendOrigin, url.origin);
        } else if (/^https?:\/\/[^\/]*onrender\.com/i.test(rewrittenLocation)) {
          rewrittenLocation = rewrittenLocation.replace(/^https?:\/\/[^\/]*onrender\.com/i, url.origin);
        } else if (/^http:\/\/([^\/]*koozy\.live)/i.test(rewrittenLocation)) {
          rewrittenLocation = rewrittenLocation.replace(/^http:\/\//i, 'https://');
        }
        responseHeaders.set('Location', rewrittenLocation);
      }

      return new Response(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: responseHeaders,
      });
    }

    // Serve Astro static pages and assets from ./dist-astro
    if (!env.ASSETS) {
      return new Response('Not found', { status: 404 });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status === 200) {
      const response = new Response(assetResponse.body, assetResponse);
      if (pathname.startsWith('/_astro/') || pathname.startsWith('/sounds/') || pathname.startsWith('/sound/')) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (!response.headers.has('Cache-Control')) {
        response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      }
      return response;
    }
    return assetResponse;
  },
};
