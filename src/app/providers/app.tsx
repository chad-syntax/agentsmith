'use client';

import { GetUserOrganizationDataResult } from '@/lib/onboarding';
import { createContext, useContext, useMemo, useState } from 'react';
import { ORGANIZATION_KEYS } from '@/app/constants';

type Organization =
  GetUserOrganizationDataResult['organization_users'][number]['organizations'];
type Project = Organization['projects'][number];

type AppContextType = {
  selectedOrganizationUuid: string | null;
  selectedProjectUuid: string | null;
  setSelectedOrganizationUuid: (uuid: string) => void;
  setSelectedProjectUuid: (uuid: string) => void;
  selectedOrganization: Organization | null;
  selectedProject: Project | null;
  isLoading: boolean;
  hasOpenRouterKey: boolean;
};

const AppContext = createContext<AppContextType>({
  selectedOrganizationUuid: null,
  selectedProjectUuid: null,
  setSelectedOrganizationUuid: () => {},
  setSelectedProjectUuid: () => {},
  selectedOrganization: null,
  selectedProject: null,
  isLoading: true,
  hasOpenRouterKey: false,
});

type AppProviderProps = {
  userOrganizationData: GetUserOrganizationDataResult;
  children: React.ReactNode;
  selectedProjectUuid?: string;
  selectedOrganizationUuid?: string;
};

export const AppProvider = (props: AppProviderProps) => {
  const {
    children,
    userOrganizationData,
    selectedProjectUuid: initialSelectedProjectUuid,
    selectedOrganizationUuid: initialSelectedOrganizationUuid,
  } = props;

  const [selectedOrganizationUuid, _setSelectedOrganizationUuid] = useState<
    string | null
  >(initialSelectedOrganizationUuid ?? null);
  const [selectedProjectUuid, _setSelectedProjectUuid] = useState<
    string | null
  >(initialSelectedProjectUuid ?? null);

  const initialSelectedOrganization = initialSelectedOrganizationUuid
    ? (userOrganizationData.organization_users.find(
        (orgUser) =>
          orgUser.organizations.uuid === initialSelectedOrganizationUuid
      )?.organizations ?? null)
    : null;

  const initialSelectedProject = initialSelectedProjectUuid
    ? (initialSelectedOrganization?.projects.find(
        (project) => project.uuid === initialSelectedProjectUuid
      ) ?? null)
    : null;

  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(initialSelectedOrganization);
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    initialSelectedProject
  );
  const [isLoading, setIsLoading] = useState(
    !(initialSelectedProjectUuid || initialSelectedOrganizationUuid)
  );

  const hasOpenRouterKey =
    selectedOrganization?.organization_keys.some(
      (key) => key.key === ORGANIZATION_KEYS.OPENROUTER_API_KEY
    ) ?? false;

  const setSelectedOrganizationUuid = (uuid: string) => {
    _setSelectedOrganizationUuid(uuid);
    setSelectedOrganization(
      userOrganizationData.organization_users.find(
        (orgUser) => orgUser.organizations.uuid === uuid
      )?.organizations ?? null
    );
  };

  const setSelectedProjectUuid = (uuid: string) => {
    _setSelectedProjectUuid(uuid);
    setSelectedProject(
      selectedOrganization?.projects.find((project) => project.uuid === uuid) ??
        null
    );
  };

  const value = useMemo(
    () => ({
      selectedOrganizationUuid,
      selectedProjectUuid,
      setSelectedOrganizationUuid,
      setSelectedProjectUuid,
      selectedOrganization,
      selectedProject,
      isLoading,
      hasOpenRouterKey,
    }),
    [
      selectedOrganizationUuid,
      selectedProjectUuid,
      selectedOrganization,
      selectedProject,
      isLoading,
      hasOpenRouterKey,
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
