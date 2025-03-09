import { Database } from '@/app/__generated__/supabase.types';
import { SupabaseClient } from '@supabase/supabase-js';
import { LLMLogsService } from './LLMLogsService';
import { OrganizationsService } from './OrganizationsService';
import { PromptsService } from './PromptsService';
import { UsersService } from './UsersService';
import { VaultService } from './VaultService';
import { ProjectsService } from './ProjectsService';

export type AgentsmithServicesDirectory = {
  users: UsersService;
  organizations: OrganizationsService;
  prompts: PromptsService;
  vault: VaultService;
  llmLogs: LLMLogsService;
  projects: ProjectsService;
};

type AgentsmithServicesConstructorOptions = {
  supabase: SupabaseClient<Database>;
};

export class AgentsmithServices {
  public services!: AgentsmithServicesDirectory;

  constructor(options: AgentsmithServicesConstructorOptions) {
    const { supabase } = options;

    const users = new UsersService({ supabase });
    const organizations = new OrganizationsService({ supabase });
    const prompts = new PromptsService({ supabase });
    const vault = new VaultService({ supabase });
    const llmLogs = new LLMLogsService({ supabase });
    const projects = new ProjectsService({ supabase });

    this.services = {
      users,
      organizations,
      prompts,
      vault,
      llmLogs,
      projects,
    };

    users.services = this.services;
    organizations.services = this.services;
    prompts.services = this.services;
    vault.services = this.services;
    llmLogs.services = this.services;
    projects.services = this.services;
  }
}
