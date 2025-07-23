import { routes } from '@/utils/routes';
import { pricingPlans } from '@/constants/pricing';
import packageJson from '../../package.json';
// @ts-ignore
import gitHandoffScreenshot from '@/assets/landing-page-video-covers/git-handoff.jpg';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://agentsmith.app';

const offersFromPricing = pricingPlans.flatMap((plan) => {
  const planOffers = [];

  // Free plan
  if (plan.title === 'Free') {
    planOffers.push({
      '@type': 'Offer',
      name: `${plan.title} Plan`,
      description: plan.description,
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    });
  }

  // Plans with monthly/yearly pricing
  if (plan.monthly) {
    planOffers.push({
      '@type': 'Offer',
      name: `${plan.title} Plan - Monthly`,
      description: plan.description,
      price: (plan.monthly.discountedPrice ?? plan.monthly.price).toString(),
      priceCurrency: 'USD',
      billingIncrement: 'Month',
      availability: 'https://schema.org/InStock',
    });
  }

  if (plan.yearly) {
    planOffers.push({
      '@type': 'Offer',
      name: `${plan.title} Plan - Yearly`,
      description: plan.description,
      price: (plan.yearly.discountedPrice ?? plan.yearly.price).toString(),
      priceCurrency: 'USD',
      billingIncrement: 'Year',
      availability: 'https://schema.org/InStock',
    });
  }

  // Enterprise plan (custom pricing)
  if (plan.title === 'Enterprise') {
    planOffers.push({
      '@type': 'Offer',
      name: `${plan.title} Plan`,
      description: plan.description,
      priceSpecification: {
        '@type': 'PriceSpecification',
        price: 'Custom',
        priceCurrency: 'USD',
      },
      availability: 'https://schema.org/InStock',
    });
  }

  return planOffers;
});

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Agentsmith',
  url: siteUrl,
  description: 'The ultimate Prompt CMS. Build, refine, and ship AI agents faster.',
  foundingDate: '2024',
  sameAs: [routes.external.github],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Agentsmith',
  alternateName: 'Agentsmith Prompt CMS',
  url: siteUrl,
  description:
    'Unleash your prompt engineers. Unshackle your developers. Agentsmith is the ultimate Prompt CMS.',
  potentialAction: {
    '@type': 'RegisterAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}${routes.auth.signUp}`,
    },
    name: 'Sign up for Agentsmith',
    description: 'Create an account to start building AI agents with Agentsmith',
  },
};

export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Agentsmith',
  operatingSystem: 'Web Browser',
  applicationCategory: 'DeveloperApplication',
  description:
    'Prompt CMS for building, refining, and shipping AI agents faster. Features typed prompts, robust authoring, Git integration, and unified API access.',
  softwareVersion: packageJson.version,
  releaseNotes: 'Alpha release with core prompt management features',
  offers: offersFromPricing,
  featureList: [
    'Typed Prompts with generated TypeScript types',
    'Robust collaborative authoring environment',
    'Git integration with automated Pull Requests',
    'Unified API access to multiple AI providers',
    'Real-time testing and debugging',
    'Version control for prompts',
  ],
  downloadUrl: routes.external.npm,
  screenshot: `${siteUrl}${gitHandoffScreenshot.src || gitHandoffScreenshot}`,
};

export const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Agentsmith Prompt CMS',
  description:
    'A comprehensive Prompt Content Management System for building, refining, and shipping AI agents faster. Features typed prompts, collaborative authoring, Git integration, and unified API access.',
  brand: {
    '@type': 'Brand',
    name: 'Agentsmith',
  },
  category: 'Software',
  offers: offersFromPricing,
  image: `${siteUrl}${gitHandoffScreenshot.src || gitHandoffScreenshot}`,
  url: `${siteUrl}/#pricing`,
  manufacturer: {
    '@type': 'Organization',
    name: 'Agentsmith',
    url: siteUrl,
  },
};

// Function to create Article schema for documentation pages
export const createArticleSchema = (options: {
  title: string;
  description: string;
  slug?: string[];
  datePublished?: string;
  dateModified?: string;
}) => {
  const { title, description, slug = [], datePublished, dateModified } = options;

  // Generate URL from slug
  const urlPath = slug.length > 0 ? `/docs/${slug.join('/')}` : '/docs';
  const articleUrl = `${siteUrl}${urlPath}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: articleUrl,
    author: {
      '@type': 'Organization',
      name: 'Agentsmith',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Agentsmith',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}${gitHandoffScreenshot.src || gitHandoffScreenshot}`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Agentsmith Documentation',
      url: `${siteUrl}/docs`,
    },
  };
};
