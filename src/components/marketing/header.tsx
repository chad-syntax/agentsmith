'use client';

import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import { routes } from '@/utils/routes';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/shadcn';

export const Header = () => {
  const posthog = usePostHog();

  const [scrolledDown, setScrolledDown] = useState(false);

  const handleStudioClick = () => {
    posthog.capture('header_studio_cta_clicked');
  };

  const handleAccessClick = () => {
    posthog.capture('header_early_access_cta_clicked');
    const $button = document.getElementById('join-alpha-club');
    if ($button) {
      setTimeout(() => {
        $button.focus();
      }, 1);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolledDown(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-3 lg:px-5 container mx-auto pt-2">
      <div
        className={cn(
          'w-full rounded-3xl border border-transparent transition-all duration-300 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          scrolledDown &&
            'shadow-md border border-muted-foreground/25 dark:shadow-muted-foreground/25 dark:shadow-sm',
        )}
      >
        <div className="flex items-center justify-between lg:grid lg:grid-cols-3 h-16 px-4 lg:px-6">
          <div className="flex items-center">
            <Link href={routes.marketing.home} className="text-xl font-bold">
              Agentsmith
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-x-2 lg:gap-x-4 flex-1 justify-center rounded-md p-1">
            <Link
              href="/#benefits"
              className="text-sm font-medium text-foreground/70 hover:text-foreground"
            >
              Product
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-foreground/70 hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-foreground/70 hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/#faq"
              className="text-sm font-medium text-foreground/70 hover:text-foreground"
            >
              FAQ
            </Link>
          </nav>
          <div className="flex items-center justify-end gap-2 lg:gap-4">
            <ThemeSwitcher />
            <Button
              onClick={handleStudioClick}
              variant="outline"
              className="hidden md:inline-flex"
              asChild
            >
              <Link href={routes.studio.home}>Studio</Link>
            </Button>
            <Button className="hidden xs:inline-flex" onClick={handleAccessClick} asChild>
              <a href="/#pricing">Early Access</a>
            </Button>
            <Button className="inline-flex xs:hidden" onClick={handleAccessClick} asChild>
              <a href="/#pricing">Alpha</a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
