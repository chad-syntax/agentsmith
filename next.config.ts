import type { NextConfig } from 'next';

const self = "'self'";
const unsafeInline = "'unsafe-inline'";
const unsafeEval = "'unsafe-eval'";
const blob = 'blob:';
const data = 'data:';

// Supabase: allow any *.supabase.co and local dev on any port
const supabaseWildcard = '*.supabase.co';
const supabaseWsWildcard = 'wss://*.supabase.co';
const localhostWildcard = 'localhost:*'; // covers http on any port
const localhostWsWildcard = 'ws://localhost:*'; // covers ws on any port

// PostHog: general wildcard
const posthogHosts = '*.posthog.com';

// Google services
const googleTagManager = '*.googletagmanager.com';
const googleAnalytics = '*.google-analytics.com';
const googleAds = 'googleads.g.doubleclick.net';
const googleAdServices = 'www.googleadservices.com';
const googleFonts = 'fonts.googleapis.com';
const gStatic = '*.gstatic.com'; // For fonts, images, styles from Google
const googleConnect = 'www.google.com'; // For Google Ads/CCM connect

// Cloudflare
const cfChallenges = 'challenges.cloudflare.com';

// Brevo (Sendinblue)
const sibforms = 'sibforms.com *.sibforms.com';

// Stripe
const stripeJs = 'js.stripe.com';
const stripeFrame = '*.stripe.com'; // For frames
const stripeApi = 'api.stripe.com'; // For connect

// Other known services
const unpkg = 'unpkg.com';
const vercelAssets = 'assets.vercel.com';
const vercelVitals = 'vitals.vercel-insights.com';
const githubAvatars = 'avatars.githubusercontent.com';
const openrouter = 'openrouter.ai *.openrouter.ai';
const githubCom = 'github.com'; // For form-action

const nextConfig: NextConfig = {
  async headers() {
    const cspHeader = [
      `default-src ${self}`,
      `script-src ${self} ${unsafeEval} ${unsafeInline} ${supabaseWildcard} ${localhostWildcard} ${cfChallenges} ${posthogHosts} ${googleTagManager} ${googleAnalytics} ${googleAds} ${googleAdServices} ${sibforms} ${stripeJs} ${unpkg} ${vercelAssets}`,
      `style-src ${self} ${unsafeInline} ${googleFonts} ${gStatic} ${sibforms}`,
      `img-src ${self} ${blob} ${data} ${supabaseWildcard} ${localhostWildcard} ${googleAnalytics} ${googleAds} ${gStatic} ${githubAvatars} ${googleConnect} ${googleAdServices}`,
      `font-src ${self} ${gStatic}`,
      `worker-src ${self} ${blob}`,
      `frame-src ${self} ${cfChallenges} ${sibforms} ${stripeFrame} td.doubleclick.net ${googleTagManager}`,
      `connect-src ${self} ${supabaseWildcard} ${supabaseWsWildcard} ${localhostWildcard} ${localhostWsWildcard} ${cfChallenges} ${posthogHosts} ${googleAnalytics} ${googleTagManager} ${googleAds} ${googleAdServices} ${googleConnect} ${sibforms} ${stripeApi} ${openrouter} ${vercelVitals}`,
      `object-src 'none'`, // Note: 'none' should be quoted
      `base-uri ${self}`,
      `form-action ${self} ${githubCom} ${openrouter} ${sibforms}`,
      `upgrade-insecure-requests`,
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
