'use client';

import Link from 'next/link';
import * as Collapsible from '@radix-ui/react-collapsible';
import { useState } from 'react';
import {
  IconPrompt,
  IconMenu2,
  IconUser,
  IconList,
  IconHome,
} from '@tabler/icons-react';
import { usePathname } from 'next/navigation';

type DashboardSidebarProps = {
  hasOnboarded: boolean;
};

export const DashboardSidebar = (props: DashboardSidebarProps) => {
  const { hasOnboarded } = props;

  const [isOpen, setIsOpen] = useState(true);

  const pathname = usePathname();

  const navItems = [
    {
      name: 'Home',
      href: '/studio',
      icon: IconHome,
      active: pathname === '/studio',
    },
    ...(hasOnboarded
      ? [
          {
            name: 'Prompts',
            href: '/studio/prompts',
            icon: IconPrompt,
            active: pathname.startsWith('/studio/prompts'),
          },
          {
            name: 'Logs',
            href: '/studio/logs',
            icon: IconList,
            active: pathname.startsWith('/studio/logs'),
          },
        ]
      : []),
    {
      name: 'Account',
      href: '/studio/account',
      icon: IconUser,
      active: pathname.startsWith('/studio/account'),
    },
  ];

  return (
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
  );
};
