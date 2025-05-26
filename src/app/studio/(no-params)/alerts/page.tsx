import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { AlertsPage } from '@/page-components/AlertsPage';

export default async function Alerts() {
  const supabase = await createClient();

  const { services } = new AgentsmithServices({ supabase });

  const alerts = await services.alerts.getAlerts();

  return <AlertsPage alerts={alerts} />;
}
