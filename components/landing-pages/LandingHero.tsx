import {
  IconPencilBolt,
  IconTerminal2,
  IconExchange,
  IconRocket,
  IconCode,
} from '@tabler/icons-react';
import { twMerge } from 'tailwind-merge';
import { ThemeSwitcher } from '../theme-switcher';
import { useRef, useState } from 'react';
import { usePostHog } from 'posthog-js/react';

type LandingHeroProps = {
  withAlphaClub?: boolean;
  withOpenSource?: boolean;
};

export const LandingHero = (props: LandingHeroProps) => {
  const posthog = usePostHog();

  const { withAlphaClub = true, withOpenSource = false } = props;

  const [alphaClubClicked, setAlphaClubClicked] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAlphaClubClick = () => {
    setAlphaClubClicked(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setAlphaClubClicked(false);
    }, 3000);

    posthog.capture('hero_alpha_club_clicked');
  };

  const handleWaitlistClicked = () => {
    posthog.capture('hero_waitlist_clicked');
  };

  return (
    <div className="mb-16">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-5xl font-bold ">Agentsmith</h2>
        <ThemeSwitcher />
      </div>
      <div className="flex justify-start items-start">
        <div className="max-w-2xl">
          <h1 className="text-8xl font-bold leading-tight mb-10 leading-[90px]">
            AI AGENT
            <br />
            DEVELOPMENT
            <br />
            PLATFORM
          </h1>
          <button
            onClick={handleWaitlistClicked}
            className="bg-gradient-to-r from-[#0198B2] via-[#27AC96] to-[#7DD957] text-white px-8 py-4 text-3xl mb-10"
          >
            <a href="#EMAIL">Secure a spot on the waitlist</a>
          </button>
          {withAlphaClub && (
            <button
              onClick={handleAlphaClubClick}
              className="border-2 border-dashed border-teal-500 p-3 text-teal-600 inline-block relative"
            >
              <span>
                For 50% off your first year after launch, join the Alpha Club!
              </span>
              <div
                className={twMerge(
                  alphaClubClicked ? 'opacity-1' : 'opacity-0',
                  'p-2 transition-opacity duration-300 absolute right-0 translate-x-[calc(100%+16px)] top-1/2 -translate-y-1/2 bg-background border border-foreground shadow-xs z-10'
                )}
              >
                <span className="text-sm text-foreground">Coming Soon!</span>
                <div className="absolute top-1/2 -left-2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-foreground transform -translate-y-1/2" />
              </div>
            </button>
          )}
        </div>
        <div className="space-y-4 mt-12 ml-16 text-2xl">
          <div className="flex items-center gap-3">
            <span>
              <IconPencilBolt />
            </span>
            <span>Best-in-class Prompt Authoring</span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              <IconTerminal2 />
            </span>
            <span>Tight Developer Integration</span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              <IconExchange />
            </span>
            <span>Swap LLMs with a Click</span>
          </div>
          {!withOpenSource ? (
            <div className="flex items-center gap-3">
              <span>
                <IconRocket />
              </span>
              <span>Ship with Rock-Solid Confidence</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span>
                <IconCode />
              </span>
              <span>Open Source on GitHub</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
