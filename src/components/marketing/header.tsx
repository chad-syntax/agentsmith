'use client';

import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import { routes } from '@/utils/routes';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/shadcn';
import { useIsLoggedIn } from '@/hooks/use-is-logged-in';

export const Header = () => {
  const posthog = usePostHog();

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
          <div className="flex items-center justify-end gap-2 lg:gap-4">
            <Button className="rounded-full p-0 has-[>svg]:px-0" variant="ghost" asChild>
              <a href={routes.external.github} target="_blank" rel="noopener noreferrer">
                <svg
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  className="fill-foreground"
                  aria-hidden="true"
                >
                  <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                </svg>
              </a>
            </Button>
            <ThemeSwitcher />
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
