import { AgentsmithServicesDirectory } from './AgentsmithServices';

export type AgentsmithServiceConstructorOptions = {
  serviceName: string;
};

export class AgentsmithService {
  protected serviceName: string;
  public services!: AgentsmithServicesDirectory;

  constructor(options: AgentsmithServiceConstructorOptions) {
    const { serviceName } = options;
    this.serviceName = serviceName;
  }
}
