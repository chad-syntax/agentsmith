'use client';

import { ChevronDown, Settings, Slash } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/providers/app';
import { useNavItems } from '@/hooks/nav-items';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { ThemeSwitcher } from './theme-switcher';
import { CurrentUserAvatar } from './current-user-avatar';

export const StudioHeader = () => {
  const {
    selectedOrganizationUuid,
    setSelectedOrganizationUuid,
    selectedOrganization,
    selectedProjectUuid,
    selectedProject,
    setSelectedProjectUuid,
    userOrganizationData,
  } = useApp();

  const { navItems, activeItem } = useNavItems();

  const headerNavItems = navItems.filter(
    (item) => item.name !== 'Edit' && item.name !== 'Settings',
  );

  const organizations =
    userOrganizationData?.organization_users?.flatMap((orgUser: any) =>
      orgUser.organizations ? [orgUser.organizations] : [],
    ) || [];

  const showMiddleBreadcrumb =
    activeItem.slug !== 'edit-organization' &&
    activeItem.slug !== 'organization' &&
    activeItem.slug !== 'settings' &&
    activeItem.slug !== 'account';

  return (
    <header className="w-full p-3 border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">A</h2>
          <Breadcrumb>
            <BreadcrumbList>
              {organizations.length > 1 ? (
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="cursor-pointer flex items-center gap-1">
                      {selectedOrganization?.name}
                      <ChevronDown className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {organizations.map((org) => (
                        <DropdownMenuItem
                          onClick={() => setSelectedOrganizationUuid(org.uuid)}
                          className="cursor-pointer"
                          key={org.uuid}
                        >
                          {org.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbLink href={routes.studio.organization(selectedOrganizationUuid)}>
                    {selectedOrganization?.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
              {showMiddleBreadcrumb && (
                <>
                  <BreadcrumbSeparator>
                    <Slash />
                  </BreadcrumbSeparator>
                  {selectedOrganization?.projects.length > 1 ? (
                    <BreadcrumbItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer flex items-center gap-1">
                          {selectedProject?.name}
                          <ChevronDown className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {selectedOrganization?.projects.map((project) => (
                            <DropdownMenuItem
                              onClick={() => setSelectedProjectUuid(project.uuid)}
                              className="cursor-pointer"
                              key={project.uuid}
                            >
                              {project.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </BreadcrumbItem>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbLink href={routes.studio.project(selectedProjectUuid)}>
                        {selectedProject?.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  )}
                </>
              )}
              {activeItem.slug !== 'organization' && (
                <>
                  <BreadcrumbSeparator>
                    <Slash />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="cursor-pointer flex items-center gap-1">
                        <activeItem.icon className="h-4 w-4" />
                        {activeItem.name}
                        <ChevronDown className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {headerNavItems.map((item) => (
                          <Link
                            href={item.href}
                            className="flex items-center gap-2"
                            key={item.slug}
                          >
                            <DropdownMenuItem className="w-full cursor-pointer">
                              <item.icon className="h-4 w-4" />
                              {item.name}
                            </DropdownMenuItem>
                          </Link>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <Link className="px-2" href={routes.studio.settings(selectedOrganizationUuid)}>
            <Settings className="h-4 w-4" />
          </Link>
          <Link href={routes.studio.account}>
            <CurrentUserAvatar />
          </Link>
        </div>
      </div>
    </header>
  );
};
