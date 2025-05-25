import { useState } from 'react';
import { VALID_ROADMAP_SCORES } from '@/app/constants';
import { Button } from '../ui/button';
import { cn } from '@/utils/shadcn';
import { Star, Circle } from 'lucide-react';

type RatingCtaProps = {
  currentRating: number;
  onClick: (score: number) => void;
};

export const RatingCta = (props: RatingCtaProps) => {
  const { currentRating, onClick } = props;

  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  return (
    <div className="flex">
      {VALID_ROADMAP_SCORES.map((s: number) => {
        const isFilled = hoveredRating ? s <= hoveredRating : currentRating && s <= currentRating;
        return (
          <Button
            key={s}
            variant="ghost"
            size="icon"
            onMouseEnter={() => setHoveredRating(s)}
            onMouseLeave={() => setHoveredRating(null)}
            onClick={() => onClick(s)}
            className={cn('h-8 w-8 hover:bg-transparent focus:bg-transparent')}
          >
            {isFilled ? (
              <Star className="size-6 text-primary" />
            ) : (
              <Circle className="size-2 text-muted-foreground" />
            )}
          </Button>
        );
      })}
    </div>
  );
};
