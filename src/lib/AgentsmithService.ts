import { AgentsmithServicesDirectory } from './AgentsmithServices';
import { Logger } from 'pino';
import { logger } from './logger';

export type AgentsmithServiceConstructorOptions = {
  serviceName: string;
};

export class AgentsmithService {
  public serviceName: string;
  public services!: AgentsmithServicesDirectory;
  public logger: Logger;

  constructor(options: AgentsmithServiceConstructorOptions) {
    const { serviceName } = options;
    this.serviceName = serviceName;
    this.logger = logger.child({ service: serviceName });
  }
}
