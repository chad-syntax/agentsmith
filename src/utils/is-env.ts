export const isProd =
  process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'production' ||
  process.env.VERCEL_TARGET_ENV === 'production';
export const isStage =
  process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'staging' ||
  process.env.VERCEL_TARGET_ENV === 'staging';
export const isDev = !isProd && !isStage;
