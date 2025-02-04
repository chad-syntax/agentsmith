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
import Link from 'next/link';

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
      <div className="flex justify-between items-center mb-4 md:mb-12">
        <Link href="/">
          <h2 className="text-2xl md:text-5xl font-bold">Agentsmith</h2>
        </Link>
        <ThemeSwitcher />
      </div>
      <div className="flex justify-start items-center md:items-start flex-col lg:flex-row">
        <div className="flex flex-col">
          <h1 className="max-w-[400px] md:max-w-none text-5xl md:text-8xl font-bold leading-tight mb-10 leading-[1] md:leading-[90px]">
            AI AGENT
            <br />
            DEVELOPMENT
            <br />
            PLATFORM
          </h1>
          <button
            onClick={handleWaitlistClicked}
            className="bg-gradient-to-r from-[#0198B2] via-[#27AC96] to-[#7DD957] text-white px-8 py-4 text-2xl md:text-3xl mb-10"
          >
            <a href="#EMAIL">Secure a spot on the waitlist</a>
          </button>
          {withAlphaClub && (
            <button
              onClick={handleAlphaClubClick}
              className="border-2 border-dashed border-teal-500 p-3 text-teal-600 inline-block relative mb-16 md:mb-0 text-xs md:text-base"
            >
              <span>
                For 50% off your first year after launch, join the Alpha Club!
              </span>
              <div
                className={twMerge(
                  alphaClubClicked ? 'opacity-1' : 'opacity-0',
                  'p-2 transition-opacity duration-300 absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-[calc(100%+16px)] bg-background border border-foreground shadow-xs z-10'
                )}
              >
                <span className="text-sm text-foreground">Coming Soon!</span>
                <div className="absolute top-0 left-1/2  -translate-x-1/2 -translate-y-full w-0 h-0 border-8 border-r-8 border-t-transparent border-l-transparent border-r-transparent border-foreground" />
              </div>
            </button>
          )}
        </div>
        <div className="space-y-4 md:mt-12 md:ml-16 text-2xl">
          <div className="flex items-start gap-3">
            <span className="mt-1">
              <IconPencilBolt />
            </span>
            <span>Best-in-class Prompt Authoring</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1">
              <IconTerminal2 />
            </span>
            <span>Tight Developer Integration</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1">
              <IconExchange />
            </span>
            <span>Swap LLMs with a Click</span>
          </div>
          {!withOpenSource ? (
            <div className="flex items-start gap-3">
              <span className="mt-1">
                <IconRocket />
              </span>
              <span>Ship with Rock-Solid Confidence</span>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <span className="mt-1">
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
