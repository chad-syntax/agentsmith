import pino from 'pino';

const level =
  process.env.VERCEL_ENV === 'production'
    ? 'info'
    : process.env.VERCEL_ENV === 'preview'
      ? 'debug'
      : 'debug';

export const logger = pino({
  level,
  name: 'agentsmith',
});
