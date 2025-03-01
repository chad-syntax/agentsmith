'use client';

import {
  getLocalStorageItem,
  LOCAL_STORAGE_KEYS,
  setLocalStorageItem,
} from '&/local-storage';
import { GetUserOrganizationDataResult } from '@/lib/onboarding';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ORGANIZATION_KEYS } from '../constants';

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
  const [hasOpenRouterKey, setHasOpenRouterKey] = useState(false);

  useEffect(() => {
    const lsSelectedOrganizationUuid = getLocalStorageItem(
      LOCAL_STORAGE_KEYS.SELECTED_ORGANIZATION_UUID
    );

    const isValidOrganizationUuid =
      userOrganizationData.organization_users.some(
        (orgUser) => orgUser.organizations.uuid === lsSelectedOrganizationUuid
      );

    if (lsSelectedOrganizationUuid && isValidOrganizationUuid) {
      _setSelectedOrganizationUuid(lsSelectedOrganizationUuid);
      const targetOrganization =
        userOrganizationData.organization_users.find(
          (orgUser) => orgUser.organizations.uuid === lsSelectedOrganizationUuid
        )?.organizations ?? null;
      setSelectedOrganization(targetOrganization);

      const hasOpenRouterKey =
        targetOrganization?.organization_keys.some(
          (key) => key.key === ORGANIZATION_KEYS.OPENROUTER_API_KEY
        ) ?? false;

      setHasOpenRouterKey(hasOpenRouterKey);
    } else {
      const firstOrganization =
        userOrganizationData.organization_users[0]?.organizations;
      _setSelectedOrganizationUuid(firstOrganization?.uuid);
      setLocalStorageItem(
        LOCAL_STORAGE_KEYS.SELECTED_ORGANIZATION_UUID,
        firstOrganization?.uuid
      );
      setHasOpenRouterKey(
        firstOrganization?.organization_keys.some(
          (key) => key.key === ORGANIZATION_KEYS.OPENROUTER_API_KEY
        ) ?? false
      );
    }

    const lsSelectedProjectUuid = getLocalStorageItem(
      LOCAL_STORAGE_KEYS.SELECTED_PROJECT_UUID
    );

    const isValidProjectUuid = userOrganizationData.organization_users.some(
      (orgUser) =>
        orgUser.organizations.projects.some(
          (project) => project.uuid === lsSelectedProjectUuid
        )
    );

    if (lsSelectedProjectUuid && isValidProjectUuid) {
      _setSelectedProjectUuid(lsSelectedProjectUuid);
      setSelectedProject(
        userOrganizationData.organization_users
          .find((orgUser) =>
            orgUser.organizations.projects.find(
              (project) => project.uuid === lsSelectedProjectUuid
            )
          )
          ?.organizations.projects.find(
            (project) => project.uuid === lsSelectedProjectUuid
          ) ?? null
      );
    } else {
      const firstProject =
        userOrganizationData.organization_users?.[0]?.organizations
          ?.projects?.[0];
      _setSelectedProjectUuid(firstProject?.uuid);
      setLocalStorageItem(
        LOCAL_STORAGE_KEYS.SELECTED_PROJECT_UUID,
        firstProject?.uuid
      );
    }

    setIsLoading(false);
  }, []);

  const setSelectedOrganizationUuid = (uuid: string) => {
    _setSelectedOrganizationUuid(uuid);
    setSelectedOrganization(
      userOrganizationData.organization_users.find(
        (orgUser) => orgUser.organizations.uuid === uuid
      )?.organizations ?? null
    );
    setLocalStorageItem(LOCAL_STORAGE_KEYS.SELECTED_ORGANIZATION_UUID, uuid);
  };

  const setSelectedProjectUuid = (uuid: string) => {
    _setSelectedProjectUuid(uuid);
    setLocalStorageItem(LOCAL_STORAGE_KEYS.SELECTED_PROJECT_UUID, uuid);
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
