import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site, url }) => {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL || site || url.origin).toString().replace(/\/$/, '');
  const robots = `User-agent: *
Allow: /
Allow: /join/
Allow: /auth/login/
Disallow: /host/
Disallow: /api/
Disallow: /ws/
Disallow: /join/*/

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
