import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL || site || 'https://koozy.live').toString().replace(/\/$/, '');
  const now = new Date().toISOString().split('T')[0];

  const publicRoutes = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/live-quiz/', priority: '0.9', changefreq: 'weekly' },
    { path: '/ai-quiz-maker/', priority: '0.9', changefreq: 'weekly' },
    { path: '/how-it-works/', priority: '0.8', changefreq: 'monthly' },
    { path: '/faq/', priority: '0.8', changefreq: 'monthly' },
    { path: '/about/', priority: '0.6', changefreq: 'monthly' },
    { path: '/contact/', priority: '0.5', changefreq: 'monthly' },
    { path: '/privacy/', priority: '0.3', changefreq: 'yearly' },
    { path: '/terms/', priority: '0.3', changefreq: 'yearly' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes
  .map(
    (route) => `  <url>
    <loc>${siteUrl}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
