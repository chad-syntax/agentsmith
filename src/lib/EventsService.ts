import { Database } from '@/app/__generated__/supabase.types';
import { AgentsmithSupabaseService } from './AgentsmithSupabaseService';
import { SupabaseClient } from '@supabase/supabase-js';

type EventsServiceConstructorOptions = {
  supabase: SupabaseClient<Database>;
};

type SyncEventOptions = {
  organizationId: number;
  projectId: number;
  projectName: string;
  source: 'repo' | 'agentsmith';
  details?: Record<string, any>;
};

type CreateAlertEventOptions = {
  organizationId: number;
  projectId: number;
  name: string;
  description: string;
  severity: Database['public']['Enums']['agentsmith_event_severity'];
  details?: Record<string, any>;
};

export class EventsService extends AgentsmithSupabaseService {
  constructor(options: EventsServiceConstructorOptions) {
    super({ ...options, serviceName: 'events' });
  }

  private static getDescription(
    type: Database['public']['Enums']['agentsmith_event_type'],
    sourceInput: 'agentsmith' | 'repo',
    projectName: string,
  ) {
    const source = sourceInput === 'agentsmith' ? `Agentsmith: ${projectName}` : 'GitHub';
    const destination = sourceInput === 'repo' ? `Agentsmith: ${projectName}` : 'GitHub';

    const action =
      type === 'SYNC_START' ? 'started' : type === 'SYNC_COMPLETE' ? 'completed' : 'failed';

    return `Sync ${action} from ${source} to ${destination}`;
  }

  async createSyncStartEvent(options: SyncEventOptions) {
    const { organizationId, projectId, projectName, source: sourceInput, details } = options;

    const description = EventsService.getDescription('SYNC_START', sourceInput, projectName);

    const source = sourceInput === 'agentsmith' ? 'agentsmith' : 'repo';
    const destination = sourceInput === 'agentsmith' ? 'repo' : 'agentsmith';

    const { data, error } = await this.supabase.from('agentsmith_events').insert({
      organization_id: organizationId,
      project_id: projectId,
      type: 'SYNC_START' as const,
      name: 'Sync Started',
      description,
      details: {
        ...details,
        source,
        destination,
      },
    });

    if (error) {
      this.logger.error(error, 'Error creating sync start event');
      throw error;
    }

    return data;
  }

  async createSyncCompleteEvent(options: SyncEventOptions) {
    const { organizationId, projectId, projectName, source: sourceInput, details } = options;

    const source = sourceInput === 'agentsmith' ? 'agentsmith' : 'repo';
    const destination = sourceInput === 'agentsmith' ? 'repo' : 'agentsmith';

    let description = EventsService.getDescription('SYNC_COMPLETE', sourceInput, projectName);
    let name = 'Sync Completed';

    if (details?.changesMade === false) {
      description += ' (no changes)';
      name = 'Sync Completed (no changes)';
    }

    const { data, error } = await this.supabase.from('agentsmith_events').insert({
      organization_id: organizationId,
      project_id: projectId,
      type: 'SYNC_COMPLETE' as const,
      name,
      description,
      details: {
        ...details,
        source,
        destination,
      },
    });

    if (error) {
      this.logger.error(error, 'Error creating sync complete event');
      throw error;
    }

    return data;
  }

  async createSyncErrorEvent(options: SyncEventOptions) {
    const { organizationId, projectId, projectName, source, details } = options;

    const description = EventsService.getDescription('SYNC_ERROR', source, projectName);
    const destination = source === 'agentsmith' ? 'repo' : 'agentsmith';

    const { data, error } = await this.supabase.from('agentsmith_events').insert({
      organization_id: organizationId,
      project_id: projectId,
      type: 'SYNC_ERROR' as const,
      name: 'Sync Error',
      severity: 'ERROR',
      description,
      details: {
        ...details,
        source,
        destination,
      },
    });

    if (error) {
      this.logger.error(error, 'Error creating sync error event');
      throw error;
    }

    return data;
  }

  async createAlertEvent(options: CreateAlertEventOptions) {
    const { organizationId, projectId, name, description, severity, details } = options;

    const { data, error } = await this.supabase.from('agentsmith_events').insert({
      organization_id: organizationId,
      project_id: projectId,
      type: 'ALERT' as const,
      name,
      description,
      severity,
      details,
    });

    if (error) {
      this.logger.error(error, 'Error creating alert event');
      throw error;
    }

    return data;
  }

  async getEventsByProjectId(projectId: number) {
    const { data, error } = await this.supabase
      .from('agentsmith_events')
      .select('*, projects(*)') // Assuming relation to projects table exists
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(error, 'Error fetching events:');
      return [];
    }

    return data;
  }

  async getEventByUuid(uuid: string) {
    const { data, error } = await this.supabase
      .from('agentsmith_events')
      .select(
        `
        *,
        projects(*)
      `,
      )
      .eq('uuid', uuid)
      .single();

    if (error) {
      this.logger.error(error, 'Error fetching event:');
      return null;
    }

    return data;
  }
}

export type GetEventsByProjectIdResult = Awaited<
  ReturnType<typeof EventsService.prototype.getEventsByProjectId>
>;

export type GetEventByUuidResult = Awaited<
  ReturnType<typeof EventsService.prototype.getEventByUuid>
>;
