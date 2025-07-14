import { DisplayTime } from '@/components/display-time';
import { LogSourceBadge } from '@/components/log-source-badge';
import { routes } from '@/utils/routes';
import Link from 'next/link';
import { Badge } from '../../components/ui/badge';
import { LogData } from './log-type';
import { GetProjectDataResult } from '@/lib/ProjectsService';
import { P } from '@/components/typography';

type LogItemProps = {
  log: LogData;
  projectUuid: string;
};

export const LogItem = (props: LogItemProps) => {
  const { log, projectUuid } = props;

  const status = log.end_time ? 'Completed' : 'In Progress';

  const duration = log.duration_ms ? `${(log.duration_ms / 1000).toFixed(2)}s` : 'Running...';

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

export const renderLogItem = (project: NonNullable<GetProjectDataResult>) => (log: any) => (
  <LogItem key={log.uuid} log={log as LogData} projectUuid={project.uuid} />
);

export const renderNoResults = () => (
  <div className="text-center py-10">
    <P className="text-muted-foreground">No logs found matching your filters.</P>
  </div>
);

export const renderSkeleton = (count: number) => (
  <div className="flex flex-col">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="border-b border-border last:border-b-0">
        <div className="grid grid-cols-8 gap-4 px-6 py-4">
          <div className="bg-muted rounded w-32 h-4 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-20 h-5 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-16 h-4 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-40 h-4 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-16 h-4 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-24 h-4 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-20 h-4 animate-pulse">&nbsp;</div>
          <div className="bg-muted rounded w-12 h-4 animate-pulse">&nbsp;</div>
        </div>
      </div>
    ))}
  </div>
);
