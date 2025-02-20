'use client';

import { useState } from 'react';
import Link from 'next/link';
import { redirect, usePathname } from 'next/navigation';
import * as Collapsible from '@radix-ui/react-collapsible';
import {
  IconPrompt,
  IconRobot,
  IconMenu2,
  IconUser,
} from '@tabler/icons-react';
import { useAuth } from '../providers/auth';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout(props: DashboardLayoutProps) {
  const { children } = props;

  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    redirect('/sign-in');
  }

  const navItems = [
    {
      name: 'Prompts',
      href: '/app/prompts',
      icon: IconPrompt,
      active: pathname.startsWith('/app/prompts'),
    },
    {
      name: 'Agents',
      href: '/app/agents',
      icon: IconRobot,
      active: pathname.startsWith('/app/agents'),
    },
    {
      name: 'Account',
      href: '/app/account',
      icon: IconUser,
      active: pathname.startsWith('/app/account'),
    },
  ];

  return (
    <div className="flex h-screen">
      <Collapsible.Root
        open={isOpen}
        onOpenChange={setIsOpen}
        className={`bg-gray-50 border-r transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <span className={`font-bold ${!isOpen && 'hidden'}`}>Dashboard</span>
          <Collapsible.Trigger asChild>
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <IconMenu2
                className={`w-5 h-5 transition-transform ${
                  isOpen ? '' : 'transform rotate-180'
                }`}
              />
            </button>
          </Collapsible.Trigger>
        </div>
        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-2 p-2 rounded-md mb-2 ${
                item.active ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {isOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </Collapsible.Root>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
