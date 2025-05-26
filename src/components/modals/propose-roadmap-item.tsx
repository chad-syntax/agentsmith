'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { RatingCta } from '@/components/roadmap/rating-cta';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth';
import { VALID_ROADMAP_SCORES } from '@/app/constants';
import { CreateRoadmapItemPayload } from '@/lib/RoadmapService';
import { RoadmapService } from '@/lib/RoadmapService';

type ProposeRoadmapItemModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuggestionAdded: () => void;
};

export const ProposeRoadmapItemModal = (props: ProposeRoadmapItemModalProps) => {
  const { isOpen, onOpenChange, onSuggestionAdded } = props;
  const { agentsmithUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [impactScore, setImpactScore] = useState<number>(VALID_ROADMAP_SCORES[2] || 3);
  const [isLoading, setIsLoading] = useState(false);

  const MAX_DESCRIPTION_LENGTH = 180;
  const MAX_TITLE_LENGTH = 48;

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description cannot be empty.');
      return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
      toast.error(`Title cannot exceed ${MAX_TITLE_LENGTH} characters.`);
      return;
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      toast.error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`);
      return;
    }
    if (!VALID_ROADMAP_SCORES.includes(impactScore as any)) {
      toast.error(`Impact score must be one of ${VALID_ROADMAP_SCORES.join(', ')}.`);
      return;
    }
    if (!agentsmithUser?.id) {
      toast.error('You must be logged in to propose an item.');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const roadmapService = new RoadmapService({ supabase });
      const payload: CreateRoadmapItemPayload = {
        creator_user_id: agentsmithUser.id,
        title,
        body: description,
        initial_impact_score: impactScore,
      };
      await roadmapService.createRoadmapItem(payload);
      toast.success('Your suggestion has been submitted.');
      setTitle('');
      setDescription('');
      setImpactScore(VALID_ROADMAP_SCORES[2] || 3);
      onOpenChange(false);
      onSuggestionAdded();
    } catch (error: any) {
      console.error('Error proposing roadmap item:', error);
      toast.error(error.message || 'Failed to submit suggestion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>What is your biggest pain point?</DialogTitle>
          <DialogDescription>
            Please make sure to check the roadmap to see if your idea has already been suggested.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a concise title for your suggestion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              maxLength={MAX_TITLE_LENGTH}
            />
            <p className="text-sm text-muted-foreground text-right">
              {title.length}/{MAX_TITLE_LENGTH}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your suggestion in detail"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              disabled={isLoading}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            <p className="text-sm text-muted-foreground text-right">
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="impact-score">How much would this help you? (1-5)</Label>
            <RatingCta currentRating={impactScore} onClick={setImpactScore} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !title.trim() ||
              !description.trim() ||
              description.length > MAX_DESCRIPTION_LENGTH ||
              title.length > MAX_TITLE_LENGTH ||
              !VALID_ROADMAP_SCORES.includes(impactScore as any)
            }
          >
            {isLoading ? 'Submitting...' : 'Submit Suggestion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
