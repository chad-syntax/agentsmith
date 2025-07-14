import pino from 'pino';
import { isProd } from '@/utils/is-env';

const level = isProd ? 'info' : 'debug';

export const logger = pino({
  level,
  name: 'agentsmith',
});
