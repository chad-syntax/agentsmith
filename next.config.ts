import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

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
const googleConnect = 'www.google.com'; // For Google Ads/CCM connect, and now images
const googleCalendar = 'calendar.google.com';
const googleApis = 'apis.google.com';

// Cloudflare
const cfChallenges = 'challenges.cloudflare.com';

// Brevo (Sendinblue)
const sibforms = 'sibforms.com *.sibforms.com';

// Stripe
const stripeJs = 'js.stripe.com';
const stripeFrame = '*.stripe.com'; // For frames
const stripeApi = 'api.stripe.com'; // For connect

// Vercel
const vercelAssets = 'assets.vercel.com';
const vercelVitals = 'vitals.vercel-insights.com';
const vercelLive = 'vercel.live'; // For Vercel live feedback/preview tool\s
const vercelBlob = '*.public.blob.vercel-storage.com';

// Sentry
const sentryIngest = 'o447951.ingest.sentry.io';

// Other known services
const unpkg = 'unpkg.com';
const githubAvatars = 'avatars.githubusercontent.com';
const openrouter = 'openrouter.ai *.openrouter.ai';
const githubCom = 'github.com'; // For form-action
const youtube = 'www.youtube.com';
const youtubeImg = 'i.ytimg.com';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/discord',
        destination: 'https://discord.gg/FbdSJZCK2h',
        permanent: false,
      },
      {
        source: '/github',
        destination: 'https://github.com/chad-syntax/agentsmith',
        permanent: false,
      },
    ];
  },
  async headers() {
    const cspHeader = [
      `default-src ${self}`,
      `script-src ${self} ${unsafeEval} ${unsafeInline} ${supabaseWildcard} ${localhostWildcard} ${cfChallenges} ${posthogHosts} ${googleTagManager} ${googleAnalytics} ${googleAds} ${googleAdServices} ${sibforms} ${stripeJs} ${unpkg} ${vercelAssets} ${vercelLive} ${googleApis}`,
      `style-src ${self} ${unsafeInline} ${googleFonts} ${gStatic} ${sibforms}`,
      `img-src ${self} ${blob} ${data} ${supabaseWildcard} ${localhostWildcard} ${googleAnalytics} ${googleAds} ${gStatic} ${githubAvatars} ${googleConnect} ${googleAdServices} ${googleTagManager} ${vercelBlob} ${youtubeImg}`,
      `font-src ${self} ${gStatic}`,
      `media-src ${self} ${vercelBlob}`,
      `worker-src ${self} ${blob}`,
      `frame-src ${self} ${cfChallenges} ${sibforms} ${stripeFrame} td.doubleclick.net ${googleTagManager} ${vercelLive} ${youtube} ${googleCalendar}`,
      `connect-src ${self} ${supabaseWildcard} ${supabaseWsWildcard} ${localhostWildcard} ${localhostWsWildcard} ${cfChallenges} ${posthogHosts} ${googleAnalytics} ${googleTagManager} ${googleAds} ${googleAdServices} ${googleConnect} ${sibforms} ${stripeApi} ${openrouter} ${vercelVitals} ${vercelLive} wss://${vercelLive} ${sentryIngest}`,
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
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  reactStrictMode: true,
};

export default withSentryConfig(withBundleAnalyzer(withMDX(nextConfig)), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'agentsmith',
  project: 'javascript-nextjs',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
