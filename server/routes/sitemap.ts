import { FastifyInstance } from 'fastify';

export default async function sitemapRoutes(fastify: FastifyInstance) {
  // Generate dynamic sitemap
  fastify.get('/sitemap.xml', async (request, reply) => {
    const baseUrl = 'https://dogepump.com';
    const currentDate = new Date().toISOString();

    // Static pages
    const staticPages = [
      { url: '/', lastmod: currentDate, changefreq: 'daily', priority: '1.0' },
      { url: '/launch', lastmod: currentDate, changefreq: 'weekly', priority: '0.9' },
      { url: '/leaderboard', lastmod: currentDate, changefreq: 'hourly', priority: '0.8' },
      { url: '/earn', lastmod: currentDate, changefreq: 'weekly', priority: '0.7' },
      { url: '/bridge', lastmod: currentDate, changefreq: 'monthly', priority: '0.6' },
      { url: '/doge-tv', lastmod: currentDate, changefreq: 'daily', priority: '0.7' },
    ];

    // Dynamic token pages (would be fetched from database in production)
    const dynamicTokens: Array<{ url: string; lastmod: string; changefreq: string; priority: string }> = [];

    // Combine all URLs
    const allUrls = [...staticPages, ...dynamicTokens];

    // Generate XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    reply
      .type('application/xml')
      .header('Cache-Control', 'public, max-age=3600')
      .send(xml);
  });

  // Generate sitemap index for large sites
  fastify.get('/sitemap-index.xml', async (request, reply) => {
    const currentDate = new Date().toISOString();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://dogepump.com/sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;

    reply
      .type('application/xml')
      .header('Cache-Control', 'public, max-age=3600')
      .send(xml);
  });

  // Robots.txt endpoint
  fastify.get('/robots.txt', async (request, reply) => {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: https://dogepump.com/sitemap.xml
Sitemap: https://dogepump.com/sitemap-index.xml`;

    reply
      .type('text/plain')
      .header('Cache-Control', 'public, max-age=86400')
      .send(robotsTxt);
  });
}
