'use client';

import { usePostHog } from 'posthog-js/react';
import { useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

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
    <div className="max-w-[1400px] w-full mx-auto px-16 py-12">
      <h2 className="text-2xl font-bold text-foreground/60 text-center mb-8">
        Agentsmith is not publicly available yet.
      </h2>
      <h1 className="text-4xl font-bold text-center mb-8">
        Join the waitlist to be invited to our private beta!
      </h1>
      {withAlphaClub && (
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={() => handleAlphaClubClick()}
            className="flex items-center gap-1 border border-background border-success bg-success/10 bg-white text-success px-2 py-1 rounded-md text-xs"
          >
            Get 50% off the first year of public launch by joining the Alpha
            Club!
          </button>

          <p
            className={twMerge(
              'text-sm text-foreground/60 text-center transition-opacity duration-300 mt-4 border rounded border-foreground p-1',
              alphaClubClicked ? 'opacity-100' : 'opacity-0'
            )}
          >
            Coming soon!
          </p>
        </div>
      )}
    </div>
  );
};
