import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site, url }) => {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL || site || url.origin).toString().replace(/\/$/, '');
  const now = new Date().toISOString().split('T')[0];

  const publicRoutes = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/join/', priority: '0.8', changefreq: 'monthly' },
    { path: '/auth/login/', priority: '0.6', changefreq: 'monthly' },
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
