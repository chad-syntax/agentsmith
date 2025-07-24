// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://47ac82f56247809b9a8481580aa7082f@o4509720013504512.ingest.us.sentry.io/4509720016781312',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // only enable on actual environments, not local
  enabled: Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV),
});
