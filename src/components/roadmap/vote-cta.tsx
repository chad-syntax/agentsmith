'use client';

import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/utils/shadcn';
import Link from 'next/link';
import { toast } from 'sonner';
import type { RoadmapItem } from '@/lib/RoadmapService';
import { useAuth } from '@/providers/auth';
import { routes } from '@/utils/routes';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { RatingCta } from './rating-cta';

type RoadmapVoteCta = {
  item: RoadmapItem & {
    currentUserUpvoted?: boolean;
    currentUserScore?: number | null;
  };
  onUpvote: (
    item: RoadmapItem & {
      currentUserUpvoted?: boolean;
      currentUserScore?: number | null;
    },
    score: number,
  ) => Promise<void>;
};

export const RoadmapVoteCta = (props: RoadmapVoteCta) => {
  const { item, onUpvote } = props;

  const { agentsmithUser, isLoading: isAuthLoading } = useAuth();

  const currentUserId = agentsmithUser?.id;

  if (isAuthLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="flex items-center gap-1">
        <ChevronUp className="h-5 w-5" />
        <span>{item.upvote_count || 0}</span>
      </Button>
    );
  }

  if (!currentUserId) {
    return (
      <Link href={routes.auth.signIn}>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => toast.info('You must be logged in to vote')}
        >
          <div>
            <ChevronUp className="h-5 w-5" />
            <span>{item.upvote_count || 0}</span>
          </div>
        </Button>
      </Link>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex items-center gap-1 text-muted-foreground',
            item.currentUserScore && 'text-primary hover:text-primary',
          )}
        >
          <ChevronUp className={cn('h-5 w-5')} />
          <span>{item.upvote_count || 0}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-fit px-2 py-1">
        <RatingCta
          currentRating={item.currentUserScore || 0}
          onClick={(n: number) => onUpvote(item, n)}
        />
      </PopoverContent>
    </Popover>
  );
};
