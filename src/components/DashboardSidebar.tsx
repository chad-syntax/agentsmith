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
  IconBuilding,
} from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/app/providers/app';
import { OrganizationSelector } from '@/components/OrganizationSelector';
import type { GetUserOrganizationDataResult } from '@/lib/onboarding';
import { routes } from '@/utils/routes';

export type DashboardSidebarProps = {
  isOnboarded: boolean;
  userOrganizationData: GetUserOrganizationDataResult;
};

export const DashboardSidebar = (props: DashboardSidebarProps) => {
  const { isOnboarded, userOrganizationData } = props;
  const { selectedOrganizationUuid, selectedProjectUuid } = useApp();

  const [isOpen, setIsOpen] = useState(true);

  const pathname = usePathname();

  const navItems = [
    {
      name: 'Home',
      href: routes.studio.home,
      icon: IconHome,
      active: pathname === routes.studio.home,
    },
    {
      name: 'Project',
      href: routes.studio.project(selectedProjectUuid),
      icon: IconBuilding,
      active: pathname === routes.studio.project(selectedProjectUuid),
    },
    {
      name: 'Organization',
      href: routes.studio.organization(selectedOrganizationUuid),
      icon: IconBuilding,
      active: pathname.startsWith(
        routes.studio.organization(selectedOrganizationUuid)
      ),
    },
    ...(isOnboarded
      ? [
          {
            name: 'Prompts',
            href: routes.studio.prompts(selectedProjectUuid),
            icon: IconPrompt,
            active: pathname.startsWith(
              routes.studio.prompts(selectedProjectUuid)
            ),
          },
          {
            name: 'Logs',
            href: routes.studio.logs(selectedProjectUuid),
            icon: IconList,
            active: pathname.startsWith(
              routes.studio.logs(selectedProjectUuid)
            ),
          },
        ]
      : []),
    {
      name: 'Account',
      href: routes.studio.account,
      icon: IconUser,
      active: pathname.startsWith(routes.studio.account),
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
      <OrganizationSelector userOrganizationData={userOrganizationData} />
    </Collapsible.Root>
  );
};
