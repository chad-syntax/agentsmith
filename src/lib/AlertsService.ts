import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';

export class AlertsService extends AgentsmithSupabaseService {
  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({
      ...options,
      serviceName: 'alerts',
    });
  }

  async getAlerts() {
    const { data, error } = await this.supabase.from('alerts').select('*, roadmap_items(slug)');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getUnreadAlertsCount() {
    const { count, error } = await this.supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .is('read_at', null);

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  }

  async readAlert(alertId: number) {
    const { error } = await this.supabase
      .from('alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('id', alertId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }
}

export type GetUnreadAlertsCountResult = Awaited<
  ReturnType<typeof AlertsService.prototype.getUnreadAlertsCount>
>;

export type GetAlertsResult = Awaited<ReturnType<typeof AlertsService.prototype.getAlerts>>;
