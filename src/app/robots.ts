import type { MetadataRoute } from 'next';
import { isProd } from '@/utils/is-env';

export default function robots(): MetadataRoute.Robots {
  if (isProd) {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: '/studio',
      },
      sitemap: 'https://agentsmith.dev/sitemap.xml',
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
