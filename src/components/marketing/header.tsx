'use client';

import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import { routes } from '@/utils/routes';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/shadcn';
import { useIsLoggedIn } from '@/hooks/use-is-logged-in';
import { GithubIcon } from '../icons/github';

export const Header = () => {
  const [scrolledDown, setScrolledDown] = useState(false);
  const { isLoggedIn, isLoading } = useIsLoggedIn();

  const handleStudioClick = () => {
    posthog.capture('header_studio_cta_clicked');
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
            <Link href={routes.marketing.home} className="text-base 2xs:text-xl font-bold">
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
              href={routes.docs.home}
              className="text-sm font-medium text-foreground/70 hover:text-foreground"
            >
              Docs
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
          <div className="flex items-center justify-end gap-1 2xs:gap-2 lg:gap-4">
            <div>
              <Button variant="ghost" asChild>
                <a href={routes.external.github} target="_blank" rel="noopener noreferrer">
                  <GithubIcon />
                </a>
              </Button>
              <ThemeSwitcher />
            </div>
            <Button
              onClick={handleStudioClick}
              variant={isLoading || isLoggedIn ? 'outline' : 'default'}
              disabled={isLoading}
            >
              <Link href={isLoading || isLoggedIn ? routes.studio.home : routes.auth.signUp}>
                <span className="hidden xs:inline-flex">
                  {isLoading || !isLoggedIn ? 'Get Started' : 'Studio'}
                </span>
                <span className="xs:hidden">{isLoading || !isLoggedIn ? 'Start' : 'Studio'}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
