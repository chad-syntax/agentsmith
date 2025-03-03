'use client';

import { GetUserOrganizationDataResult } from '@/lib/onboarding';
import { createContext, useContext, useMemo, useState } from 'react';
import { ORGANIZATION_KEYS } from '@/app/constants';
import { redirect, useRouter } from 'next/navigation';
import { routes } from '@/utils/routes';

type Organization =
  GetUserOrganizationDataResult['organization_users'][number]['organizations'];
type Project = Organization['projects'][number];

type AppContextType = {
  selectedOrganizationUuid: string;
  selectedProjectUuid: string;
  setSelectedOrganizationUuid: (uuid: string) => void;
  setSelectedProjectUuid: (uuid: string) => void;
  selectedOrganization: Organization;
  selectedProject: Project;
  hasOpenRouterKey: boolean;
  isOrganizationAdmin: boolean;
};

const AppContext = createContext<AppContextType>({
  selectedOrganizationUuid: '',
  selectedProjectUuid: '',
  setSelectedOrganizationUuid: () => {},
  setSelectedProjectUuid: () => {},
  selectedOrganization: {} as Organization,
  selectedProject: {} as Project,
  hasOpenRouterKey: false,
  isOrganizationAdmin: false,
});

type AppProviderProps = {
  userOrganizationData: GetUserOrganizationDataResult;
  selectedProjectUuid: string;
  selectedOrganizationUuid: string;
  children: React.ReactNode;
};

export const AppProvider = (props: AppProviderProps) => {
  const {
    children,
    userOrganizationData,
    selectedProjectUuid: initialSelectedProjectUuid,
    selectedOrganizationUuid: initialSelectedOrganizationUuid,
  } = props;

  const router = useRouter();

  const [selectedOrganizationUuid, _setSelectedOrganizationUuid] =
    useState<string>(initialSelectedOrganizationUuid);
  const [selectedProjectUuid, _setSelectedProjectUuid] = useState<string>(
    initialSelectedProjectUuid
  );

  const initialSelectedOrganization =
    userOrganizationData.organization_users.find(
      (orgUser) =>
        orgUser.organizations.uuid === initialSelectedOrganizationUuid
    )?.organizations ??
    userOrganizationData.organization_users[0].organizations;

  const initialSelectedProject =
    initialSelectedOrganization?.projects.find(
      (project) => project.uuid === initialSelectedProjectUuid
    ) ?? initialSelectedOrganization?.projects[0];

  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization>(initialSelectedOrganization);
  const [selectedProject, setSelectedProject] = useState<Project>(
    initialSelectedProject
  );

  const hasOpenRouterKey =
    selectedOrganization?.organization_keys.some(
      (key) => key.key === ORGANIZATION_KEYS.OPENROUTER_API_KEY
    ) ?? false;

  const initialIsOrganizationAdmin =
    userOrganizationData.organization_users.some(
      (orgUser) =>
        orgUser.organizations.uuid === selectedOrganizationUuid &&
        orgUser.role === 'ADMIN'
    );

  const [isOrganizationAdmin, setIsOrganizationAdmin] = useState(
    initialIsOrganizationAdmin
  );

  const setSelectedOrganizationUuid = (uuid: string) => {
    _setSelectedOrganizationUuid(uuid);

    const targetOrganization =
      userOrganizationData.organization_users.find(
        (orgUser) => orgUser.organizations.uuid === uuid
      )?.organizations ?? null;

    if (!targetOrganization) {
      redirect(
        routes.error('Cannot select organization, user is not a member.')
      );
    }

    setIsOrganizationAdmin(
      userOrganizationData.organization_users.some(
        (orgUser) =>
          orgUser.organizations.uuid === uuid && orgUser.role === 'ADMIN'
      )
    );

    setSelectedOrganization(targetOrganization);
    router.push(routes.studio.organization(uuid));
  };

  const setSelectedProjectUuid = (uuid: string) => {
    _setSelectedProjectUuid(uuid);

    const targetProject =
      selectedOrganization?.projects.find((project) => project.uuid === uuid) ??
      null;

    if (!targetProject) {
      redirect(
        routes.error('Cannot select project, user does not have access.')
      );
    }

    setSelectedProject(targetProject);
    router.push(routes.studio.project(uuid));
  };

  const value = useMemo(
    () => ({
      selectedOrganizationUuid,
      selectedProjectUuid,
      setSelectedOrganizationUuid,
      setSelectedProjectUuid,
      selectedOrganization,
      selectedProject,
      hasOpenRouterKey,
      isOrganizationAdmin,
    }),
    [
      selectedOrganizationUuid,
      selectedProjectUuid,
      selectedOrganization,
      selectedProject,
      hasOpenRouterKey,
      isOrganizationAdmin,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
