'use client';

import Link from 'next/link';
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
import { routes } from '@/utils/routes';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/utils/shadcn';
import { H3 } from './typography';
import { Separator } from './ui/separator';
import { ThemeSwitcher } from './theme-switcher';
import { GetUserOrganizationDataResult } from '@/lib/UsersService';

export type DashboardSidebarProps = {
  userOrganizationData: GetUserOrganizationDataResult;
};

export const DashboardSidebar = (props: DashboardSidebarProps) => {
  const { userOrganizationData } = props;
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
    {
      name: 'Prompts',
      href: routes.studio.prompts(selectedProjectUuid),
      icon: IconPrompt,
      active: pathname.startsWith(routes.studio.prompts(selectedProjectUuid)),
    },
    {
      name: 'Logs',
      href: routes.studio.logs(selectedProjectUuid),
      icon: IconList,
      active: pathname.startsWith(routes.studio.logs(selectedProjectUuid)),
    },
    {
      name: 'Account',
      href: routes.studio.account,
      icon: IconUser,
      active: pathname.startsWith(routes.studio.account),
    },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <H3 className={cn('transition-opacity', !isOpen && 'opacity-0')}>
          Dashboard
        </H3>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          <IconMenu2
            className={cn(
              'h-4 w-4 transition-transform',
              !isOpen && 'rotate-180'
            )}
          />
        </Button>
      </div>
      <Separator />
      <nav className="flex-1 p-4">
        {navItems.map((item) => (
          <Button
            key={item.name}
            variant={item.active ? 'secondary' : 'ghost'}
            asChild
            className={cn(
              'w-full justify-start mb-1',
              !isOpen && 'justify-center'
            )}
          >
            <Link href={item.href}>
              <item.icon className={cn('h-4 w-4', isOpen && 'mr-2')} />
              {isOpen && <span>{item.name}</span>}
            </Link>
          </Button>
        ))}
      </nav>
      <Separator />
      <div className="p-4 space-y-4">
        <OrganizationSelector userOrganizationData={userOrganizationData} />
        <div
          className={cn('flex', isOpen ? 'justify-start' : 'justify-center')}
        >
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:block border-r bg-background transition-all duration-300',
          isOpen ? 'w-64' : 'w-16'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <IconMenu2 className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation menu for mobile devices
          </SheetDescription>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
};
