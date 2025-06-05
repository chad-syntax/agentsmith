import { RoadmapItem } from '@/lib/RoadmapService';
import { routes } from '@/utils/routes';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { StatusBadge } from './status-badge';
import { RoadmapVoteCta } from './vote-cta';
import { Badge } from '../ui/badge';
import { RoadmapStatus } from '@/app/constants';
import { DisplayTime } from '../display-time';

type RoadmapItemCardProps = {
  item: RoadmapItem;
  onUpvote?: (item: RoadmapItem, score: number) => Promise<void>;
};

export const RoadmapItemCard = (props: RoadmapItemCardProps) => {
  const { item, onUpvote } = props;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <StatusBadge
              state={item.state as RoadmapStatus}
              className="px-2 py-1 rounded-full text-xs"
            />
            <Badge variant="outline" className="px-2 py-1 rounded-full text-xs">
              Avg. Rating: {item.avg_score}
            </Badge>
          </div>
          {onUpvote && <RoadmapVoteCta item={item} onUpvote={onUpvote} />}
        </div>
        <Link className="hover:text-primary" href={routes.marketing.roadmapItem(item.slug)}>
          <h3 className="text-xl font-semibold line-clamp-2" title={item.title}>
            {item.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground line-clamp-3 text-sm">
          {item.body || 'No description provided.'}
        </p>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <div className="text-xs text-muted-foreground">
          {item.created_at ? (
            <>
              Added <DisplayTime dateTime={item.created_at} />
            </>
          ) : (
            'Date not available'
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
