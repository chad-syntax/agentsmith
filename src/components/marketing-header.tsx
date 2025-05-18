'use client';

import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';
import { Bell, Mail } from 'lucide-react';
import { Container } from './layout/container';
import { H3 } from './typography';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

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
    <header className="w-full border-b">
      <Container>
        <div className="flex items-center justify-between py-4">
          <Link href="/">
            <H3>Agentsmith</H3>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Separator orientation="vertical" className="h-6" />
            <nav className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" onClick={handleJoinWaitlistClick}>
                <a href="#brevo-email-subscribe">
                  <Bell className="mr-2 h-4 w-4" />
                  Join Waitlist
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href="mailto:team@agentsmith.app">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Us
                </a>
              </Button>
            </nav>
          </div>
        </div>
      </Container>
    </header>
  );
};
