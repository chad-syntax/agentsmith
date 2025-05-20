'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useApp } from '@/providers/app';
import { useNavItems } from '@/hooks/nav-items';
import { OrganizationSelector } from '@/components/organization-selector';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/utils/shadcn';
import { Separator } from './ui/separator';

const StudioMenu = () => {
  const { userOrganizationData } = useApp();

  const { navItems } = useNavItems();

  const dashboardNavItems = navItems.filter((item) => item.name !== 'Edit');

  // separate into top group and bottom group
  const groups = dashboardNavItems.reduce<[typeof dashboardNavItems, typeof dashboardNavItems]>(
    (acc, item) => {
      if (item.slug === 'organization' || item.slug === 'account' || item.slug === 'settings') {
        return [acc[0], [...acc[1], item]];
      }

      return [[...acc[0], item], acc[1]];
    },
    [[], []],
  );

  return (
    <div className="h-full flex flex-col">
      <nav className="flex-1 px-1 overflow-hidden flex flex-col justify-between pb-4">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.map((item) => (
              <Button
                key={item.slug}
                variant="ghost"
                asChild
                className={cn(
                  'p-0 has-[>svg]:px-0 mx-0.5 mt-2 flex justify-start',
                  item.active && 'bg-muted-foreground/20',
                )}
              >
                <Link href={item.href}>
                  <span className="inline-block p-2">
                    <item.icon className="size-5" />
                  </span>
                  <span>{item.name}</span>
                </Link>
              </Button>
            ))}
          </div>
        ))}
      </nav>
      <Separator className="block md:hidden" />
      <div className="block md:hidden p-4 space-y-4 overflow-hidden">
        <OrganizationSelector userOrganizationData={userOrganizationData} />
      </div>
    </div>
  );
};

export const DesktopStudioSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      className={cn(
        'hidden md:block border-r bg-background transition-all duration-250 absolute z-50 h-[calc(100vh-49px)]',
        isOpen ? 'w-64' : 'w-12',
      )}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <StudioMenu />
    </aside>
  );
};

export const MobileStudioSidebar = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation menu for mobile devices
        </SheetDescription>
        <StudioMenu />
      </SheetContent>
    </Sheet>
  );
};
