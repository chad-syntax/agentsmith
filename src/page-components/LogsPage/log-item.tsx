import { DisplayTime } from '@/components/display-time';
import { LogSourceBadge } from '@/components/log-source-badge';
import { Database } from '@/app/__generated__/supabase.types';
import { routes } from '@/utils/routes';
import Link from 'next/link';
import { Badge } from '../../components/ui/badge';

type LogItemProps = {
  log: Database['public']['Tables']['llm_logs']['Row'] & {
    prompt_versions: {
      uuid: string;
      version: string;
      prompts: {
        uuid: string;
        name: string;
      } | null;
    } | null;
  };
  projectUuid: string;
};

export const LogItem = (props: LogItemProps) => {
  const { log, projectUuid } = props;

  const status = log.end_time ? 'Completed' : 'In Progress';

  // Calculate duration
  const duration = (() => {
    if (!log.end_time) return 'Running...';
    const start = new Date(log.start_time);
    const end = new Date(log.end_time);
    const diff = end.getTime() - start.getTime();
    return `${(diff / 1000).toFixed(2)}s`;
  })();

  return (
    <div className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
      <Link href={routes.studio.logDetail(projectUuid, log.uuid)} className="block cursor-pointer">
        <div className="grid grid-cols-8 gap-4 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            <DisplayTime dateTime={log.created_at} formatString="MMM d, yyyy h:mm a" />
          </div>
          <div>
            <Badge variant={log.end_time ? 'COMPLETED' : 'IN_PROGRESS'}>{status}</Badge>
          </div>
          <div className="text-muted-foreground">
            <LogSourceBadge source={log.source} />
          </div>
          <div className="text-sm text-muted-foreground">
            {log.prompt_versions?.prompts?.name || 'Unknown'}
          </div>
          <div className="text-sm text-muted-foreground">
            {log.prompt_versions?.version || 'Unknown'}
          </div>
          <div className="text-sm text-muted-foreground">{log.model || 'Unknown'}</div>
          <div className="text-sm text-muted-foreground">{log.provider || 'Unknown'}</div>
          <div className="text-sm text-muted-foreground">{duration}</div>
        </div>
      </Link>
    </div>
  );
};
