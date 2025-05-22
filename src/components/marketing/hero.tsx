'use client';

import { BrevoEmailSubscribe } from '@/components/brevo-email-subscribe/brevo-email-subscribe';
import { Button } from '../ui/button';
import { usePostHog } from 'posthog-js/react';
import promptEditorScreenshot from '@/assets/prompt-editor-screenshot.png';
import Image from 'next/image';

export const HeroSection = () => {
  const posthog = usePostHog();

  const handleAccessClick = () => {
    posthog.capture('hero_early_access_cta_clicked');
    const $button = document.getElementById('join-alpha-club');
    if ($button) {
      setTimeout(() => {
        $button.focus();
      }, 1);
    }
  };

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
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-foreground">
                DEVELOP AGENTS WITH PEACE OF MIND
              </h1>
              <div id="join-waitlist" />
              <p className="max-w-[600px] text-muted-foreground md:text-xl pt-2">
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
          <div className="flex justify-center lg:justify-end">
            <div className="w-full h-full min-h-[300px] md:min-h-[400px] rounded-lg overflow-hidden border border-border bg-card">
              <Image
                src={promptEditorScreenshot}
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
