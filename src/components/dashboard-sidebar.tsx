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
import { H3 } from './typography';
import { Separator } from './ui/separator';
import { ThemeSwitcher } from './theme-switcher';

export const DashboardSidebar = () => {
  const { userOrganizationData } = useApp();
  const [isOpen, setIsOpen] = useState(true);

  const { navItems } = useNavItems();

  const dashboardNavItems = navItems.filter(
    (item) => item.name !== 'Edit' && item.name !== 'Settings',
  );

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-1 flex items-center justify-between">
        {/* <H3 className={cn('transition-opacity', !isOpen && 'opacity-0')}>Dashboard</H3> */}
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          <Menu className={cn('h-4 w-4 transition-transform', !isOpen && 'rotate-180')} />
        </Button>
      </div>
      <Separator />
      <nav className="flex-1 p-4">
        {dashboardNavItems.map((item) => (
          <Button
            key={item.slug}
            variant={item.active ? 'secondary' : 'ghost'}
            asChild
            className={cn('w-full justify-start mb-1', !isOpen && 'justify-center')}
          >
            <Link href={item.href}>
              <item.icon className={cn('h-4 w-4', isOpen && 'mr-2')} />
              {isOpen && <span>{item.name}</span>}
            </Link>
          </Button>
        ))}
      </nav>
      <Separator />
      <div className="block lg:hidden p-4 space-y-4">
        <OrganizationSelector userOrganizationData={userOrganizationData} />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:block border-r bg-background transition-all duration-300',
          isOpen ? 'w-64' : 'w-16',
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-4 w-4" />
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
