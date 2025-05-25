'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ArrowUpDown } from 'lucide-react';
import {
  RoadmapService,
  GetRoadmapItemsResult,
  UpsertRoadmapUpvotePayload,
  RoadmapItem,
} from '@/lib/RoadmapService';
import { createClient } from '@/lib/supabase/client';
import { ProposeRoadmapItemModal } from '@/components/modals/propose-roadmap-item';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth';
import { RoadmapProposeCta } from '@/components/roadmap/propose-cta';
import { RoadmapItemCard } from '@/components/roadmap/item-card';
import {
  RoadmapStatus,
  statusDisplayNames,
  VALID_ROADMAP_SCORES,
  VALID_STATUSES,
} from '@/app/constants';

type FilterStatus = 'ALL' | RoadmapStatus;

type RoadmapPageProps = {
  initialRoadmapItems: GetRoadmapItemsResult;
};

export const RoadmapPage = (props: RoadmapPageProps) => {
  const { initialRoadmapItems } = props;
  const { agentsmithUser, isLoading: isAuthLoading } = useAuth();
  const searchParams = useSearchParams();

  const currentUserId: number | undefined = agentsmithUser?.id;

  const [roadmapItems, setRoadmapItems] = useState<
    (RoadmapItem & {
      currentUserUpvoted?: boolean;
      currentUserScore?: number | null;
    })[]
  >(initialRoadmapItems.map((item) => ({ ...item })));
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(
    searchParams.get('proposeModal') === 'true',
  );
  const [activeTab, setActiveTab] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(false); // false for most votes/newest first
  const [sortBy, setSortBy] = useState<'avg_score' | 'created_at'>('avg_score');

  // Initialize client-side upvote status
  useEffect(() => {
    const fetchUserUpvotes = async () => {
      if (isAuthLoading || typeof currentUserId !== 'number' || !roadmapItems.length) return;

      try {
        const supabase = createClient();
        const roadmapService = new RoadmapService({ supabase });
        const upvotes = await roadmapService.getUserUpvotes(currentUserId);
        const updatedItems = roadmapItems.map((item) => {
          const upvote = upvotes.find((upvote) => upvote.roadmap_item_id === item.id);
          return {
            ...item,
            currentUserUpvoted: !!upvote,
            currentUserScore: upvote?.score || null,
          };
        });

        setRoadmapItems(updatedItems);
      } catch (error) {
        console.error('Failed to fetch user upvotes', error);
        // Potentially show a toast, but avoid if it's too noisy on load
      }
    };
    fetchUserUpvotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, initialRoadmapItems, isAuthLoading]);

  const filteredAndSortedItems = useMemo(() => {
    let items = [...roadmapItems];

    // Filter by status
    if (activeTab !== 'ALL') {
      items = items.filter((item) => item.state === activeTab);
    }

    // Filter by search query (case-insensitive on title and body)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.body && item.body.toLowerCase().includes(query)),
      );
    }

    // Sort
    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'avg_score') {
        comparison = (b.avg_score || 0) - (a.avg_score || 0);
        if (comparison === 0) {
          // Secondary sort by upvote_count
          comparison = (b.upvote_count || 0) - (a.upvote_count || 0);
        }
      } else if (sortBy === 'created_at') {
        // Handle potentially null created_at for sorting
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = dateB - dateA;
      }
      return sortAscending ? comparison * -1 : comparison;
    });

    return items;
  }, [roadmapItems, activeTab, searchQuery, sortBy, sortAscending]);

  const handleUpvote = async (
    item: RoadmapItem & {
      currentUserUpvoted?: boolean;
      currentUserScore?: number | null;
    },
    score: number,
  ) => {
    if (isAuthLoading || typeof currentUserId !== 'number') {
      toast.error('You must be logged in to upvote.');
      return;
    }

    // Basic validation for score, though UI should enforce this
    if (!VALID_ROADMAP_SCORES.includes(score as any)) {
      toast.error(`Invalid score: ${score}. Please select a score from 1 to 5.`);
      return;
    }

    const supabase = createClient();
    const roadmapService = new RoadmapService({ supabase });

    try {
      // If user clicks the same score they already voted with, treat as unvoting
      if (item.currentUserUpvoted && score === item.currentUserScore) {
        await roadmapService.deleteUpvote(item.id, currentUserId);
        toast.success('Upvote removed');
        setRoadmapItems((prevItems) =>
          prevItems.map((prevItem) =>
            prevItem.id === item.id
              ? {
                  ...prevItem,
                  upvote_count: (prevItem.upvote_count || 1) - 1,
                  currentUserUpvoted: false,
                  currentUserScore: null,
                }
              : prevItem,
          ),
        );
      } else {
        const payload: UpsertRoadmapUpvotePayload = {
          roadmap_item_id: item.id,
          user_id: currentUserId,
          score: score, // Use the provided score
        };
        const updatedUpvote = await roadmapService.createOrUpdateUpvote(payload);
        toast.success(item.currentUserUpvoted ? 'Vote updated!' : 'Thanks for your vote!');
        setRoadmapItems((prevItems) =>
          prevItems.map((prevItem) =>
            prevItem.id === item.id
              ? {
                  ...prevItem,
                  upvote_count:
                    prevItem.currentUserUpvoted && prevItem.currentUserScore !== null
                      ? prevItem.upvote_count // Score changed, count remains same initially (trigger will update avg)
                      : (prevItem.upvote_count || 0) + 1, // New vote, increment count
                  currentUserUpvoted: true,
                  currentUserScore: updatedUpvote.score,
                }
              : prevItem,
          ),
        );
      }
    } catch (error: any) {
      console.error('Error handling upvote:', error);
      toast.error(error.message || 'Failed to process upvote.');
    }
  };

  const refreshRoadmapItems = async () => {
    try {
      const supabase = createClient();
      const roadmapService = new RoadmapService({ supabase });
      const items = await roadmapService.getRoadmapItems({
        states: activeTab === 'ALL' ? undefined : [activeTab],
      });

      // Re-apply user upvote status
      if (isAuthLoading || typeof currentUserId !== 'number') {
        setRoadmapItems(items.map((item) => ({ ...item })));
        return;
      }
      const updatedItemsWithUpvotes = await Promise.all(
        items.map(async (item) => {
          const upvote = await roadmapService.getUserUpvoteForItem(item.id, currentUserId);
          return { ...item, currentUserUpvoted: !!upvote, currentUserScore: upvote?.score || null };
        }),
      );
      setRoadmapItems(updatedItemsWithUpvotes);
    } catch (error) {
      console.error('Failed to refresh roadmap items', error);
      toast.error('Could not refresh roadmap items.');
    }
  };

  return (
    <div className="container py-10 mx-auto px-4 lg:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Product Roadmap</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mt-2">
            See what we're working on, vote for features, and suggest new ideas.
          </p>
        </div>

        <RoadmapProposeCta setIsProposeModalOpen={setIsProposeModalOpen} />
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start md:items-center gap-4 mb-8 rounded-md">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as FilterStatus)}
          className="w-full md:w-auto hidden md:block"
        >
          <TabsList className="w-full md:w-auto grid grid-cols-3 sm:grid-cols-none sm:inline-flex">
            <TabsTrigger className="rounded-md cursor-pointer" value="ALL">
              All
            </TabsTrigger>
            {VALID_STATUSES.map((status) => (
              <TabsTrigger className="rounded-md cursor-pointer" key={status} value={status}>
                {statusDisplayNames[status]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="w-full md:hidden mb-4">
          <Select value={activeTab} onValueChange={(value) => setActiveTab(value as FilterStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {VALID_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusDisplayNames[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full md:w-auto gap-2 items-center">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const newSortBy = sortBy === 'avg_score' ? 'created_at' : 'avg_score';
              setSortBy(newSortBy);
              setSortAscending(false); // Default to descending for new sort type
            }}
            className="min-w-[130px]"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortBy === 'avg_score' ? 'By Votes' : 'By Date'}
          </Button>
        </div>
      </div>

      {filteredAndSortedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedItems.map((item) => (
            <RoadmapItemCard key={item.id} item={item} onUpvote={handleUpvote} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <h3 className="text-xl font-bold mb-2">No matching features found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your filters or suggest a new feature.
          </p>
          <RoadmapProposeCta setIsProposeModalOpen={setIsProposeModalOpen} />
        </div>
      )}

      {currentUserId && !isAuthLoading && (
        <ProposeRoadmapItemModal
          isOpen={isProposeModalOpen}
          onOpenChange={setIsProposeModalOpen}
          onSuggestionAdded={() => {
            refreshRoadmapItems(); // Refresh items after a new one is added
          }}
        />
      )}
    </div>
  );
};
