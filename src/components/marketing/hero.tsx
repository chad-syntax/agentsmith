'use client';

import { BrevoEmailSubscribe } from '@/components/brevo-email-subscribe/brevo-email-subscribe';
import { Button } from '../ui/button';
import { usePostHog } from 'posthog-js/react';
import Vivus from 'vivus';
import { useEffect, useRef } from 'react';
import FWord from '@/assets/f-word.svg';
import { AspectRatio } from '../ui/aspect-ratio';
import { LandingHeroVideos } from './landing-hero-videos';
import { routes } from '@/utils/routes';
import Link from 'next/link';

export const HeroSection = () => {
  const posthog = usePostHog();
  const vivusRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);

  const handleAccessClick = () => {
    posthog.capture('hero_early_access_cta_clicked');
    const $button = document.getElementById('join-alpha-club');
    if ($button) {
      setTimeout(() => {
        $button.focus();
      }, 1);
    }
  };

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    let animationFrameId: number | null = null;
    let interval: NodeJS.Timeout | undefined = undefined;

    const vivus = new Vivus(vivusRef.current!, {
      file: FWord.src,
      duration: 500,
      reverseStack: true,
      type: 'oneByOne',
      onReady: function (myVivus) {
        const strokeLetters = myVivus.el.querySelectorAll(
          '.letter-stroke',
        ) as NodeListOf<SVGPathElement>;
        const fillLetters = myVivus.el.querySelectorAll(
          '.letter-fill',
        ) as NodeListOf<SVGPathElement>;
        const stops = myVivus.el.querySelectorAll('stop') as NodeListOf<SVGStopElement>;

        let hueOffset = 0;
        const animationSpeed = 0.5; // Degrees to shift per frame. Lower for slower, higher for faster.
        const animateGradient = () => {
          hueOffset = (hueOffset + animationSpeed) % 360;
          stops.forEach((stop, i) => {
            const hue = (i * 10 + hueOffset) % 360; // Changed from i * 60 to i * 72
            stop.setAttribute('stop-color', `hsl(${hue}, 100%, 50%)`);
          });
          animationFrameId = requestAnimationFrame(animateGradient);
        };

        animateGradient(); // Start the animation

        const strokeLettersArray = Array.from(strokeLetters).reverse();
        const fillLettersArray = Array.from(fillLetters).reverse();
        interval = setInterval(() => {
          const firstFinishedStrokeIndex = strokeLettersArray.findIndex(
            (stroke) =>
              (stroke.style.strokeDashoffset === '0' || stroke.style.strokeDashoffset === '0px') &&
              !stroke.classList.contains('finished'),
          );
          if (firstFinishedStrokeIndex !== -1) {
            const targetFillLetter = fillLettersArray[firstFinishedStrokeIndex];
            targetFillLetter.style.opacity = '1';
            strokeLettersArray[firstFinishedStrokeIndex].classList.add('finished');
          } else if (vivus.getStatus() === 'end') {
            clearInterval(interval);
          }
        }, 30);
      },
    });

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return (
    <section className="md:py-16 bg-background relative">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <div className="h-[32px] mt-4 md:mt-0 rounded-full text-xs mb-4">&nbsp;</div>
              <h2 className="font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-foreground">
                <div className="text-[26px] 2xs:text-[30px] xs:text-[35px] sm:text-[56px] md:text-[66px] lg:text-[44px] xl:text-[56px] 2xl:text-6xl 3xl:text-[62px] text-center">
                  DEVELOP AGENTS WITH
                </div>
                <div className="text-center -mt-6 2xs:-mt-8 xs:-mt-8 sm:-mt-0 text-[60px] 2xs:text-[72px] xs:text-[82px] sm:text-[130px] md:text-[150px] lg:text-8xl xl:text-9xl 2xl:text-[140px] 3xl:text-[140px]">
                  PEACE OF
                </div>
                <AspectRatio
                  className="-mt-22 2xs:-mt-28 xs:-mt-32 sm:-mt-32 md:-mt-32 lg:-mt-24 xl:-mt-40 3xl:-mt-48"
                  ratio={131 / 57}
                >
                  <div id="vivus" ref={vivusRef} className="w-full h-full" />
                </AspectRatio>
                <div className="-mt-30 2xs:-mt-38 max-sm:-mb-12 xs:-mt-44 sm:-mt-44 md:-mt-50 lg:-mt-34 xl:-mt-48 3xl:-mt-56 text-center text-[120px] 2xs:text-[144px] xs:text-[158px] sm:text-[256px] md:text-[296px] lg:text-[196px] xl:text-[248px] 2xl:text-[272px] 3xl:text-[277px]">
                  MIND
                </div>
              </h2>
              <div id="join-waitlist" />
              <h1 className="text-muted-foreground md:text-xl pt-2">
                Unleash your prompt engineers. Unshackle your developers. Agentsmith is the ultimate
                Prompt CMS. Build, refine, and ship AI agents faster than the other guys.
              </h1>
            </div>
            <div className="flex gap-2 justify-center lg:justify-start">
              <Button size="lg" asChild>
                <Link href={routes.auth.signUp}>Get Started</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={routes.docs.home}>Docs</Link>
              </Button>
            </div>
          </div>
          <div>
            <div className="hidden lg:block">&nbsp;</div>
          </div>
        </div>
      </div>
      <LandingHeroVideos />
    </section>
  );
};
