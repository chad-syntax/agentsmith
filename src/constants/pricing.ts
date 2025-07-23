import { routes } from '@/utils/routes';

import { isProd } from '@/utils/is-env';

const sandboxPriceIds = {
  HOBBY: {
    MONTHLY: 'price_1RnKFTQpmHbJxc84EmfoQaif',
    YEARLY: 'price_1RnKFTQpmHbJxc84RWPaETFj',
  },
  PRO: {
    MONTHLY: 'price_1RnKJbQpmHbJxc84seQi9Lwe',
    YEARLY: 'price_1RnKKNQpmHbJxc84Bui7QNaD',
  },
} as const;

const prodPriceIds = {
  HOBBY: {
    MONTHLY: 'price_1Ro2GNJI5Oiq6NLc5WI5DIn9',
    YEARLY: 'price_1Ro2HYJI5Oiq6NLc3Ma9SLXp',
  },
  PRO: {
    MONTHLY: 'price_1Ro2KlJI5Oiq6NLcZAZgvI9m',
    YEARLY: 'price_1Ro2KlJI5Oiq6NLcxI8tBQM0',
  },
} as const;

const sandboxCouponCodes = {
  AGENTSMITH50: 'TWyNMo8a',
} as const;

const prodCouponCodes = {
  AGENTSMITH50: 'K4xZuanN',
} as const;

export const STRIPE_PRICE_IDS = isProd ? prodPriceIds : sandboxPriceIds;
export const COUPON_CODES = isProd ? prodCouponCodes : sandboxCouponCodes;

export type PricingCardFeature = {
  text: string;
  isPrimary?: boolean;
};

export type PricingPlan = {
  title: string;
  price?: string;
  discountedPrice?: string;
  priceDetail?: string;
  description: string;
  features: PricingCardFeature[];
  buttonText: string;
  buttonLink?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | null | undefined;
  isRecommended?: boolean;
  isDiscounted?: boolean;
  highlightText?: string;
  disabled?: boolean;
  onClick?: () => void;
  buttonId?: string;
  monthly?: {
    price: number;
    discountedPrice?: number;
    priceDetail: string;
    stripePriceId: string;
    maxSeats: number;
  };
  yearly?: {
    price: number;
    discountedPrice?: number;
    priceDetail: string;
    stripePriceId: string;
    maxSeats: number;
  };
};

export const freePlan: PricingPlan = {
  title: 'Free',
  price: 'Free',
  description: 'For personal projects and getting started.',
  features: [
    { text: '5 prompts' },
    { text: '1 User' },
    { text: '1 Project' },
    { text: '1K Logs per month' },
    { text: '7-day log retention' },
    { text: 'Community support' },
  ],
  buttonText: 'Get Started',
  buttonVariant: 'outline',
  disabled: false,
  buttonLink: routes.auth.signIn,
};

export const hobbyPlan: PricingPlan = {
  title: 'Hobby',
  description: 'For hobbyists and small projects.',
  features: [
    { text: '100 prompts', isPrimary: true },
    { text: '3 Users', isPrimary: true },
    { text: '3 Projects', isPrimary: true },
    { text: '30K Logs per month', isPrimary: true },
    { text: '90-day log retention', isPrimary: true },
    { text: 'Metrics & Analytics', isPrimary: true },
  ],
  buttonVariant: 'outline',
  buttonText: 'Get Started',
  buttonLink: routes.auth.signIn,
  isDiscounted: true,
  monthly: {
    price: 19.99,
    discountedPrice: 9.99,
    priceDetail: '/seat/mo',
    stripePriceId: STRIPE_PRICE_IDS.HOBBY.MONTHLY,
    maxSeats: 3,
  },
  yearly: {
    price: 199.99,
    discountedPrice: 99.99,
    priceDetail: '/seat/yr',
    stripePriceId: STRIPE_PRICE_IDS.HOBBY.YEARLY,
    maxSeats: 3,
  },
};

export const proPlan: PricingPlan = {
  title: 'Pro',
  description: 'For professional developers and teams.',
  features: [
    { text: 'Unlimited prompts', isPrimary: true },
    { text: 'Unlimited users', isPrimary: true },
    { text: '10 projects', isPrimary: true },
    { text: '100K Logs per month', isPrimary: true },
    { text: '365-day log retention', isPrimary: true },
    { text: 'Metrics & Analytics', isPrimary: true },
    { text: 'Priority support', isPrimary: true },
  ],
  buttonText: 'Get Started',
  buttonLink: routes.auth.signIn,
  isRecommended: true,
  isDiscounted: true,
  monthly: {
    price: 49.99,
    discountedPrice: 24.99,
    priceDetail: '/seat/mo',
    stripePriceId: STRIPE_PRICE_IDS.PRO.MONTHLY,
    maxSeats: 99,
  },
  yearly: {
    price: 499.99,
    discountedPrice: 249.99,
    priceDetail: '/seat/yr',
    stripePriceId: STRIPE_PRICE_IDS.PRO.YEARLY,
    maxSeats: 99,
  },
};

export const enterprisePlan: PricingPlan = {
  title: 'Enterprise',
  price: 'Custom',
  description: 'For large-scale applications and businesses.',
  features: [
    { text: 'Everything in Pro, plus...' },
    { text: '100 projects', isPrimary: true },
    { text: '1M Logs per month', isPrimary: true },
    { text: 'Unlimited log retention', isPrimary: true },
    { text: 'Dedicated support & SLAs', isPrimary: true },
    { text: 'Custom integrations', isPrimary: true },
    { text: 'Single Sign-On (SSO)', isPrimary: true },
  ],
  buttonText: 'Contact Sales',
  buttonLink: routes.emails.enterprise,
  buttonVariant: 'default',
};

export const pricingPlans: PricingPlan[] = [freePlan, hobbyPlan, proPlan, enterprisePlan];
