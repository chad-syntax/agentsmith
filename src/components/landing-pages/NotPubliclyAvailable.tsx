'use client';

import { usePostHog } from 'posthog-js/react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/shadcn';
import { H1, H2 } from '@/components/typography';

type NotPubliclyAvailableProps = {
  withAlphaClub?: boolean;
};

export const NotPubliclyAvailable = (props: NotPubliclyAvailableProps) => {
  const posthog = usePostHog();

  const { withAlphaClub = true } = props;

  const [alphaClubClicked, setAlphaClubClicked] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAlphaClubClick = () => {
    setAlphaClubClicked(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setAlphaClubClicked(false);
    }, 3000);

    posthog.capture('not_publicly_available_alpha_club_clicked');
  };

  return (
    <div className="max-w-[1400px] w-full mx-auto md:px-16 md:py-12 pt-8">
      <H2 className="text-muted-foreground text-center mb-8">
        Agentsmith is not publicly available yet.
      </H2>
      <H1 className="text-center mb-8">
        Join the waitlist to be invited to our private beta!
      </H1>
      {withAlphaClub && (
        <div className="flex flex-col items-center justify-center">
          <Button
            onClick={() => handleAlphaClubClick()}
            variant="outline"
            className="bg-success/15 text-success hover:bg-success/25 hover:text-success border-success"
            size="sm"
          >
            Get 50% off the first year of public launch by joining the Alpha
            Club!
          </Button>

          <Badge
            variant="outline"
            className={cn(
              'mt-4 transition-opacity duration-300',
              alphaClubClicked ? 'opacity-100' : 'opacity-0'
            )}
          >
            Coming soon!
          </Badge>
        </div>
      )}
    </div>
  );
};
