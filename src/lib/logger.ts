// import { AgentsmithService } from './AgentsmithService';
// import pino, { Logger } from 'pino';

// export class LoggingService extends AgentsmithService {
//   logger: Logger;

//   constructor() {
//     super({
//       serviceName: 'logging',
//     });

//     const level =
//       process.env.VERCEL_ENV === 'production'
//         ? 'info'
//         : process.env.VERCEL_ENV === 'preview'
//           ? 'debug'
//           : 'debug';

//     this.logger = pino({
//       level,
//       name: 'agentsmith',
//     });
//   }
// }

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
