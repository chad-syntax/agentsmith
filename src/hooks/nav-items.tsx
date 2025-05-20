import { routes } from '@/utils/routes';
import {
  Home,
  Building,
  Braces,
  List,
  Activity,
  Globe,
  User,
  Pencil,
  Settings,
  Box,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/providers/app';

export const useNavItems = () => {
  const { selectedOrganizationUuid, selectedProjectUuid } = useApp();
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Home',
      slug: 'home',
      href: routes.studio.home,
      icon: Home,
      active: pathname === routes.studio.home,
    },
    {
      name: 'Project',
      slug: 'project',
      href: routes.studio.project(selectedProjectUuid),
      icon: Box,
      active: pathname === routes.studio.project(selectedProjectUuid),
    },
    {
      name: 'Edit',
      slug: 'edit-project',
      href: routes.studio.editProject(selectedProjectUuid),
      icon: Pencil,
      active: pathname === routes.studio.editProject(selectedProjectUuid),
    },
    {
      name: 'Prompts',
      slug: 'prompts',
      href: routes.studio.prompts(selectedProjectUuid),
      icon: Braces,
      active: pathname.startsWith(routes.studio.prompts(selectedProjectUuid)),
    },
    {
      name: 'Logs',
      slug: 'logs',
      href: routes.studio.logs(selectedProjectUuid),
      icon: List,
      active: pathname.startsWith(routes.studio.logs(selectedProjectUuid)),
    },
    {
      name: 'Events',
      slug: 'events',
      href: routes.studio.events(selectedProjectUuid),
      icon: Activity,
      active: pathname.startsWith(routes.studio.events(selectedProjectUuid)),
    },

    {
      name: 'Globals',
      slug: 'globals',
      href: routes.studio.projectGlobals(selectedProjectUuid),
      icon: Globe,
      active: pathname.startsWith(routes.studio.projectGlobals(selectedProjectUuid)),
    },
    {
      name: 'Account',
      slug: 'account',
      href: routes.studio.account,
      icon: User,
      active: pathname.startsWith(routes.studio.account),
    },
    {
      name: 'Organization',
      slug: 'organization',
      href: routes.studio.organization(selectedOrganizationUuid),
      icon: Building,
      active: pathname === routes.studio.organization(selectedOrganizationUuid),
    },
    {
      name: 'Edit',
      slug: 'edit-organization',
      href: routes.studio.editOrganization(selectedOrganizationUuid),
      icon: Pencil,
      active: pathname === routes.studio.editOrganization(selectedOrganizationUuid),
    },
    {
      name: 'Settings',
      slug: 'settings',
      href: routes.studio.settings(selectedOrganizationUuid),
      icon: Settings,
      active: pathname === routes.studio.settings(selectedOrganizationUuid),
    },
  ];

  const activeItem = navItems.find((item) => item.active) ?? navItems[0];

  return { navItems, activeItem };
};
