import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { LogDetailPage } from '@/page-components/LogDetailPage';
import { routes } from '@/utils/routes';
import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ logId: string; projectUuid: string }>;
};

export default async function LogDetail(props: PageProps) {
  const { params } = props;
  const { logId, projectUuid } = await params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const log = await agentsmith.services.llmLogs.getLogByUuid(logId);

  if (!log) {
    redirect(routes.studio.logs(projectUuid));
  }

  return <LogDetailPage log={log} />;
}
