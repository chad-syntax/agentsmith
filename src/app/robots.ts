import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === 'production') {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: '/studio',
      },
      sitemap: 'https://agentsmith.app/sitemap.xml',
    };
  }

  // do not allow crawlers to index the staging environment
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}
