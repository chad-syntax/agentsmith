'use client';

import {
  RoadmapItem as APIRoadmapItem,
  RoadmapItem,
  RoadmapService,
  UpsertRoadmapUpvotePayload,
} from '@/lib/RoadmapService';
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { RoadmapVoteCta } from '@/components/roadmap/vote-cta';
import { routes } from '@/utils/routes';
import { StatusBadge } from '@/components/roadmap/status-badge';
import { Badge } from '@/components/ui/badge';
import { RoadmapStatus, VALID_ROADMAP_SCORES } from '@/app/constants';
import { ArrowLeft } from 'lucide-react';

type RoadmapItemPageProps = {
  roadmapItem: APIRoadmapItem;
};

export const RoadmapItemPage = (props: RoadmapItemPageProps) => {
  const { roadmapItem: initialRoadmapItem } = props;
  const [roadmapItem, setRoadmapItem] = useState<
    RoadmapItem & {
      currentUserUpvoted?: boolean;
      currentUserScore?: number | null;
    }
  >({ ...initialRoadmapItem });
  const { agentsmithUser, isLoading: isAuthLoading } = useAuth();
  const currentUserId: number | undefined = agentsmithUser?.id;

  useEffect(() => {
    const fetchUserUpvote = async () => {
      if (isAuthLoading || typeof currentUserId !== 'number' || !roadmapItem) return;

      try {
        const supabase = createClient();
        const roadmapService = new RoadmapService({ supabase });
        const upvotes = await roadmapService.getUserUpvotes(currentUserId);
        const upvote = upvotes.find((upvote) => upvote.roadmap_item_id === roadmapItem.id);
        setRoadmapItem((prevItem) => ({
          ...prevItem,
          currentUserUpvoted: !!upvote,
          currentUserScore: upvote?.score || null,
        }));
      } catch (error) {
        console.error('Failed to fetch user upvote for item', error);
        // Potentially show a toast
      }
    };
    if (roadmapItem) {
      fetchUserUpvote();
    }
  }, [currentUserId, roadmapItem?.id, isAuthLoading, roadmapItem]);

  const handleUpvoteInternal = async (score: number) => {
    if (isAuthLoading || typeof currentUserId !== 'number' || !roadmapItem) {
      toast.error('You must be logged in to upvote.');
      return;
    }

    if (!VALID_ROADMAP_SCORES.includes(score as any)) {
      toast.error(`Invalid score: ${score}. Please select a score from 1 to 5.`);
      return;
    }

    const supabase = createClient();
    const roadmapService = new RoadmapService({ supabase });

    try {
      if (roadmapItem.currentUserUpvoted && score === roadmapItem.currentUserScore) {
        await roadmapService.deleteUpvote(roadmapItem.id, currentUserId);
        toast.success('Upvote removed');
        setRoadmapItem((prevItem) => ({
          ...prevItem,
          upvote_count: (prevItem.upvote_count || 1) - 1,
          // avg_score might need recalculation or rely on a trigger if not updated here
          currentUserUpvoted: false,
          currentUserScore: null,
        }));
      } else {
        const payload: UpsertRoadmapUpvotePayload = {
          roadmap_item_id: roadmapItem.id,
          user_id: currentUserId,
          score: score,
        };
        const updatedUpvote = await roadmapService.createOrUpdateUpvote(payload);
        toast.success(roadmapItem.currentUserUpvoted ? 'Vote updated!' : 'Thanks for your vote!');
        setRoadmapItem((prevItem) => ({
          ...prevItem,
          upvote_count:
            prevItem.currentUserUpvoted && prevItem.currentUserScore !== null
              ? prevItem.upvote_count // Score changed, count remains same initially
              : (prevItem.upvote_count || 0) + 1, // New vote, increment count
          // avg_score will be updated by database trigger, or we might need a refresh
          currentUserUpvoted: true,
          currentUserScore: updatedUpvote.score,
        }));
      }
      // Optionally, refresh the entire item to get the latest avg_score
      // const refreshedItem = await roadmapService.getRoadmapItemById(roadmapItem.id);
      // if (refreshedItem) setRoadmapItem(prev => ({...prev, ...refreshedItem, currentUserUpvoted: prev.currentUserUpvoted, currentUserScore: prev.currentUserScore }));
    } catch (error: any) {
      console.error('Error handling upvote:', error);
      toast.error(error.message || 'Failed to process upvote.');
    }
  };

  if (!roadmapItem) {
    return <div>Loading roadmap item...</div>; // Or some other loading state
  }

  return (
    <div className="container py-10 mx-auto max-w-3xl px-4 lg:px-6">
      <div className="mb-8">
        <Link
          href={routes.marketing.roadmap()}
          className="text-sm text-primary hover:underline mb-4 flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Roadmap
        </Link>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <StatusBadge
              state={roadmapItem.state as RoadmapStatus}
              className="px-3 py-1.5 rounded-md text-sm"
            />
            <Badge variant="outline" className="px-3 py-1.5 rounded-md text-sm">
              Avg. Rating: {roadmapItem.avg_score}
            </Badge>
          </div>
          <RoadmapVoteCta
            item={roadmapItem}
            onUpvote={(_item, score) => handleUpvoteInternal(score)}
          />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">{roadmapItem.title}</h1>
        {roadmapItem.created_at && (
          <p className="text-sm text-muted-foreground mb-6">
            Added on{' '}
            <time
              dateTime={new Date(roadmapItem.created_at).toISOString()}
              suppressHydrationWarning
            >
              {new Date(roadmapItem.created_at).toLocaleDateString()}
            </time>
          </p>
        )}
      </div>

      <div className="prose dark:prose-invert max-w-none">
        {roadmapItem.body ? <div>{roadmapItem.body}</div> : <p>No description provided.</p>}
      </div>
    </div>
  );
};
