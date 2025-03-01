import { getLogByUuid } from '@/lib/logs';
import { LogDetailPage } from '@/page-components/LogDetailPage';

type PageProps = {
  params: Promise<{ logId: string }>;
};

export default async function LogDetail(props: PageProps) {
  const { params } = props;
  const { logId } = await params;
  const log = await getLogByUuid(logId);

  return <LogDetailPage log={log} />;
}
