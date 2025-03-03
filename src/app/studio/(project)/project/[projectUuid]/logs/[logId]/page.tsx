import { getLogByUuid } from '@/lib/logs';
import { LogDetailPage } from '@/page-components/LogDetailPage';
import { routes } from '@/utils/routes';
import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ logId: string; projectUuid: string }>;
};

export default async function LogDetail(props: PageProps) {
  const { params } = props;
  const { logId, projectUuid } = await params;
  const log = await getLogByUuid(logId);

  if (!log) {
    redirect(routes.studio.logs(projectUuid));
  }

  return <LogDetailPage log={log} />;
}
