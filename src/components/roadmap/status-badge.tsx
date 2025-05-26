import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/shadcn';
import { RoadmapStatus, statusDisplayNames } from '@/app/constants';

type StatusBadgeProps = {
  state: RoadmapStatus;
  className?: string;
};

export const StatusBadge = (props: StatusBadgeProps) => {
  const { state, className } = props;

  if (!state || !statusDisplayNames[state]) {
    return null;
  }

  return (
    <Badge className={cn('font-medium border', className)} variant={state}>
      {statusDisplayNames[state]}
    </Badge>
  );
};
