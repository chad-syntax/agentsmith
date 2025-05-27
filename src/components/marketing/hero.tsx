'use client';

import { BrevoEmailSubscribe } from '@/components/brevo-email-subscribe/brevo-email-subscribe';
import { Button } from '../ui/button';
import { usePostHog } from 'posthog-js/react';
import promptEditorScreenshot from '@/assets/prompt-editor-screenshot.png';
import Image from 'next/image';
import Vivus from 'vivus';
import { useEffect, useRef } from 'react';
import FWord from '@/assets/f-word.svg';
import { AspectRatio } from '../ui/aspect-ratio';

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
    <section className="md:py-16 bg-background  ">
      <div className="container px-4 md:px-6 relative mx-auto">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <Button
                asChild
                size="sm"
                className="mt-4 md:mt-0 rounded-full bg-primary/10 hover:bg-primary/20 text-xs font-medium text-primary mb-4"
              >
                <a href="#pricing" onClick={handleAccessClick}>
                  Alpha Access Available
                </a>
              </Button>
              <h1 className="font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-foreground">
                <div className="text-[26px] 2xs:text-[30px] xs:text-[35px] sm:text-[56px] md:text-[66px] lg:text-[44px] xl:text-[56px] 2xl:text-6xl 3xl:text-[82px] text-center">
                  DEVELOP AGENTS WITH
                </div>
                <div className="text-center -mt-6 2xs:-mt-8 xs:-mt-8 sm:-mt-0 text-[60px] 2xs:text-[72px] xs:text-[82px] sm:text-[130px] md:text-[150px] lg:text-8xl xl:text-9xl 2xl:text-[140px] 3xl:text-[192px]">
                  PEACE OF
                </div>
                <AspectRatio
                  className="-mt-22 2xs:-mt-28 xs:-mt-32 sm:-mt-32 md:-mt-32 lg:-mt-24 xl:-mt-40 3xl:-mt-48"
                  ratio={131 / 57}
                >
                  <div id="vivus" ref={vivusRef} className="w-full h-full" />
                </AspectRatio>
                <div className="-mt-30 2xs:-mt-38 max-sm:-mb-12 xs:-mt-44 sm:-mt-44 md:-mt-50 lg:-mt-34 xl:-mt-48 3xl:-mt-66 text-center text-[120px] 2xs:text-[144px] xs:text-[158px] sm:text-[256px] md:text-[296px] lg:text-[196px] xl:text-[248px] 2xl:text-[272px] 3xl:text-[382px]">
                  MIND
                </div>
              </h1>
              <div id="join-waitlist" />
              <p className="text-muted-foreground md:text-xl pt-2">
                Author templatized prompts, refine your AI agents, and seamlessly sync everything to
                your codebase with strict type-safety and deploy with confidence.
              </p>
            </div>
            {/* Replace form with BrevoEmailSubscribe */}
            <BrevoEmailSubscribe trackingLocation="hero" form="agentsmithInitialLanding" />
            <p className="text-primary font-medium hover:underline">
              <a href="#pricing">🎉 Pay now to receive early access. Join the alpha club!</a>
            </p>
          </div>
          <div>
            <div className="w-full h-full min-h-[300px] md:min-h-[400px] rounded-lg overflow-hidden border border-border bg-card">
              <Image
                src={promptEditorScreenshot}
                priority
                alt="Agentsmith App Placeholder"
                className="object-cover object-left h-full min-h-[300px] md:min-h-[400px] rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
