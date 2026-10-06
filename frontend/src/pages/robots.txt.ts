import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL || site || 'https://koozy.live').toString().replace(/\/$/, '');
  const robots = `User-agent: *
Allow: /
Disallow: /host/
Disallow: /auth/
Disallow: /api/
Disallow: /ws/
Disallow: /admin/
Disallow: /join/*/
Disallow: /404.html

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
