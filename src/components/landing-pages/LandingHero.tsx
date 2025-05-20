import { Pencil, TerminalSquare, ArrowLeftRight, Rocket, Code } from 'lucide-react';
import { useRef, useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import Link from 'next/link';
import { HeroHeader } from '../hero-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/shadcn';
import { H1 } from '@/components/typography';

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
      <HeroHeader />
      <div className="flex justify-start items-center md:items-start flex-col lg:flex-row">
        <div className="flex flex-col">
          <H1 className="max-w-[400px] md:max-w-none text-5xl md:text-8xl lg:text-8xl font-bold mb-10">
            AI AGENT
            <br />
            DEVELOPMENT
            <br />
            PLATFORM
          </H1>
          <Button
            onClick={handleWaitlistClicked}
            size="lg"
            className="whitespace-pre-wrap bg-gradient-to-r from-[#0198B2] via-[#27AC96] to-[#7DD957] text-white hover:opacity-90 text-2xl md:text-3xl h-auto px-8 py-4 mb-10"
            asChild
          >
            <Link href="#EMAIL">Secure a spot on the waitlist</Link>
          </Button>
          {withAlphaClub && (
            <div className="relative mb-16 md:mb-0">
              <Button
                onClick={handleAlphaClubClick}
                variant="outline"
                className="h-auto whitespace-pre-wrap border-2 border-dashed border-teal-500 text-teal-600 hover:bg-teal-50 w-full"
              >
                For 50% off your first year after launch, join the Alpha Club!
              </Button>
              <div
                className={cn(
                  'absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-[calc(100%+16px)] z-10 transition-opacity duration-300',
                  alphaClubClicked ? 'opacity-100' : 'opacity-0',
                )}
              >
                <Badge variant="outline" className="bg-background shadow-md">
                  Coming Soon!
                </Badge>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0 h-0 border-8 border-r-8 border-t-transparent border-l-transparent border-r-transparent border-border" />
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4 md:mt-12 md:ml-16 text-2xl">
          <div className="flex items-start gap-3">
            <span className="mt-1">
              <Pencil className="text-primary" />
            </span>
            <span>Best-in-class Prompt Authoring</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1">
              <TerminalSquare className="text-primary" />
            </span>
            <span>Tight Developer Integration</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1">
              <ArrowLeftRight className="text-primary" />
            </span>
            <span>Swap LLMs with a Click</span>
          </div>
          {!withOpenSource ? (
            <div className="flex items-start gap-3">
              <span className="mt-1">
                <Rocket className="text-primary" />
              </span>
              <span>Ship with Rock-Solid Confidence</span>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <span className="mt-1">
                <Code className="text-primary" />
              </span>
              <span>Open Source on GitHub</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
