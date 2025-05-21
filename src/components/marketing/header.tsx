'use client';

import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import { routes } from '@/utils/routes';

export const Header = () => {
  const handleJoinWaitlistClick = () => {
    const $emailInput = document.getElementById('EMAIL');
    if ($emailInput) {
      setTimeout(() => {
        $emailInput.focus();
      }, 1);
    }
  };

  return (
    <header className="sticky top-0 z-50 mx-2 pt-2 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="w-full border border-muted-foreground/50 rounded-3xl">
        <div className="container mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              Agentsmith
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-x-6 flex-1 justify-center rounded-md p-1">
            <Link
              href="#benefits"
              className="text-sm font-medium text-foreground/70 hover:text-foreground"
            >
              Product
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-foreground/70 hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-foreground/70 hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-foreground/70 hover:text-foreground"
            >
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Button variant="outline" className="hidden md:inline-flex" asChild>
              <Link href={routes.studio.home}>Studio</Link>
            </Button>
            <Button onClick={handleJoinWaitlistClick} asChild>
              <a href="#EMAIL">Join Waitlist</a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
