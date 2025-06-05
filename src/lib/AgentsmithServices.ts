import { Database } from '@/app/__generated__/supabase.types';
import { SupabaseClient } from '@supabase/supabase-js';
import { LLMLogsService } from './LLMLogsService';
import { OrganizationsService } from './OrganizationsService';
import { PromptsService } from './PromptsService';
import { UsersService } from './UsersService';
import { VaultService } from './VaultService';
import { ProjectsService } from './ProjectsService';
import { GitHubAppService } from './GitHubAppService';
import { GitHubWebhookService } from './GitHubWebhookService';
import { EventsService } from './EventsService';
import { GitHubSyncService } from './GitHubSyncService';
import { RoadmapService } from './RoadmapService';
import { Logger } from 'pino';
import { logger } from './logger';
import { AlertsService } from './AlertsService';
import { TypegenService } from './TypegenService';

export type AgentsmithServicesDirectory = {
  users: UsersService;
  organizations: OrganizationsService;
  prompts: PromptsService;
  vault: VaultService;
  llmLogs: LLMLogsService;
  projects: ProjectsService;
  githubApp: GitHubAppService;
  githubWebhook: GitHubWebhookService;
  githubSync: GitHubSyncService;
  events: EventsService;
  roadmap: RoadmapService;
  alerts: AlertsService;
  typegen: TypegenService;
};

type AgentsmithServicesConstructorOptions = {
  supabase: SupabaseClient<Database>;
  // if true, will call the initialize method on all services
  initialize?: boolean;
};

export class AgentsmithServices {
  public services!: AgentsmithServicesDirectory;
  public initializePromise: Promise<any[]> | null = null;
  public logger: Logger;

  constructor(options: AgentsmithServicesConstructorOptions) {
    const { supabase, initialize = true } = options;

    const users = new UsersService({ supabase });
    const organizations = new OrganizationsService({ supabase });
    const prompts = new PromptsService({ supabase });
    const vault = new VaultService({ supabase });
    const llmLogs = new LLMLogsService({ supabase });
    const projects = new ProjectsService({ supabase });
    const events = new EventsService({ supabase });
    const githubApp = new GitHubAppService({ supabase });
    const githubWebhook = new GitHubWebhookService({ supabase });
    const githubSync = new GitHubSyncService({ supabase });
    const roadmap = new RoadmapService({ supabase });
    const alerts = new AlertsService({ supabase });
    const typegen = new TypegenService({ supabase });

    this.logger = logger.child({ service: 'AgentsmithServicesRoot' });

    this.services = {
      users,
      organizations,
      prompts,
      vault,
      llmLogs,
      projects,
      githubApp,
      githubWebhook,
      githubSync,
      events,
      roadmap,
      alerts,
      typegen,
    };

    users.services = this.services;
    organizations.services = this.services;
    prompts.services = this.services;
    vault.services = this.services;
    llmLogs.services = this.services;
    projects.services = this.services;
    githubApp.services = this.services;
    githubWebhook.services = this.services;
    githubSync.services = this.services;
    events.services = this.services;
    roadmap.services = this.services;
    alerts.services = this.services;
    typegen.services = this.services;

    if (initialize) {
      for (const service of Object.values(this.services)) {
        service.services = this.services;
        const promises = [];

        if (typeof (service as any).initialize === 'function') {
          const result = (service as any).initialize();
          if (result instanceof Promise) {
            result.catch((error) => {
              this.logger.error(error, `Failed to initialize service ${service.serviceName}:`);
            });
            promises.push(result);
          }
        }

        this.initializePromise = Promise.all(promises);
      }
    }
  }
}
