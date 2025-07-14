export const isProd =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'production';
export const isStage =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'staging' || process.env.VERCEL_ENV === 'staging';
export const isDev = !isProd && !isStage;
