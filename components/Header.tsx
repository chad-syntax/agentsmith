'use client';

import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';
import { IconBell, IconMail } from '@tabler/icons-react';

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
    <header className="flex justify-center w-full border-b border-foreground/10">
      <div className="flex items-center justify-between max-w-screen-xl w-full p-4">
        <Link href="/">
          <h3 className="text-2xl font-bold">Agentsmith</h3>
        </Link>
        <div className="flex items-center justify-end gap-1">
          <ThemeSwitcher />
          <nav className="flex items-center gap-1">
            <a href="#brevo-email-subscribe">
              <button
                onClick={handleJoinWaitlistClick}
                className="flex items-center gap-1 border border-background bg-foreground text-background px-2 py-1 rounded-md text-xs"
              >
                <IconBell size={16} /> Join Waitlist
              </button>
            </a>
            <a href="mailto:team@agentsmith.app">
              <button className="flex items-center gap-1 border border-background bg-foreground text-background px-2 py-1 rounded-md text-xs">
                <IconMail size={16} /> Contact Us
              </button>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};
