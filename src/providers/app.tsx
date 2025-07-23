'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from 'react';
import { ORGANIZATION_KEYS } from '@/app/constants';
import { redirect, useRouter } from 'next/navigation';
import { routes } from '@/utils/routes';
import type {
  GetOnboardingChecklistResult,
  GetUserOrganizationDataResult,
} from '@/lib/UsersService';
import { useAuth } from './auth';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/app/__generated__/supabase.types';
import { AlertsService } from '@/lib/AlertsService';
import { handleAgentsmithEvent } from './handle-agentsmith-event';
import { UsersService } from '@/lib/UsersService';

type Organization = GetUserOrganizationDataResult['organization_users'][number]['organizations'];
type Project = Organization['projects'][number];
type OrgTierInfo = Organization['agentsmith_tiers'];

type AppContextType = {
  selectedOrganizationUuid: string;
  selectedProjectUuid: string;
  setSelectedOrganizationUuid: (uuid: string) => void;
  setSelectedProjectUuid: (uuid: string) => void;
  selectedOrganization: Organization | null;
  selectedProject: Project | null;
  userOrganizationData: GetUserOrganizationDataResult;
  hasOpenRouterKey: boolean;
  isOrganizationAdmin: boolean;
  userNeedsOrgMembership: boolean;
  orgTierInfo: OrgTierInfo | null;
  showSyncTooltip: () => void;
  isSyncTooltipVisible: boolean;
  unreadAlertsCount: number;
  setUnreadAlertsCount: Dispatch<SetStateAction<number>>;
  onboardingChecklist: GetOnboardingChecklistResult[number] | null;
  setOnboardingChecklist: Dispatch<SetStateAction<GetOnboardingChecklistResult[number] | null>>;
};

const AppContext = createContext<AppContextType>({
  selectedOrganizationUuid: '',
  selectedProjectUuid: '',
  setSelectedOrganizationUuid: () => {},
  setSelectedProjectUuid: () => {},
  selectedOrganization: null,
  selectedProject: null,
  userOrganizationData: {} as GetUserOrganizationDataResult,
  hasOpenRouterKey: false,
  isOrganizationAdmin: false,
  userNeedsOrgMembership: false,
  orgTierInfo: null,
  showSyncTooltip: () => {},
  isSyncTooltipVisible: false,
  unreadAlertsCount: 0,
  setUnreadAlertsCount: () => {},
  onboardingChecklist: null,
  setOnboardingChecklist: () => {},
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
  const { agentsmithUser } = useAuth();
  const supabase = createClient();

  const [selectedOrganizationUuid, _setSelectedOrganizationUuid] = useState<string>(
    initialSelectedOrganizationUuid,
  );
  const [selectedProjectUuid, _setSelectedProjectUuid] = useState<string>(
    initialSelectedProjectUuid,
  );
  const [isSyncTooltipVisible, setIsSyncTooltipVisible] = useState(false);
  const [onboardingChecklist, setOnboardingChecklist] = useState<
    GetOnboardingChecklistResult[number] | null
  >(null);
  const initialSelectedOrganization: Organization | null =
    userOrganizationData.organization_users?.find(
      (orgUser) => orgUser.organizations.uuid === initialSelectedOrganizationUuid,
    )?.organizations ??
    userOrganizationData.organization_users?.[0]?.organizations ??
    null;

  const initialSelectedProject =
    initialSelectedOrganization?.projects.find(
      (project) => project.uuid === initialSelectedProjectUuid,
    ) ??
    initialSelectedOrganization?.projects[0] ??
    null;

  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(
    initialSelectedOrganization,
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(initialSelectedProject);

  const hasOpenRouterKey =
    selectedOrganization?.organization_keys.some(
      (key) => key.key === ORGANIZATION_KEYS.OPENROUTER_API_KEY,
    ) ?? false;

  const initialIsOrganizationAdmin = userOrganizationData.organization_users?.some(
    (orgUser) =>
      orgUser.organizations.uuid === selectedOrganizationUuid && orgUser.role === 'ADMIN',
  );

  const initialUserNeedsOrgMembership = userOrganizationData.organization_users.length === 0;

  const [isOrganizationAdmin, setIsOrganizationAdmin] = useState(initialIsOrganizationAdmin);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [userNeedsOrgMembership, setUserNeedsOrgMembership] = useState(
    initialUserNeedsOrgMembership,
  );

  const orgTierInfo = selectedOrganization?.agentsmith_tiers ?? null;

  const getOnboardingChecklist = async () => {
    const usersService = new UsersService({ supabase });
    const onboardingChecklist = await usersService.getOnboardingChecklist();
    const targetOnboardingChecklist =
      onboardingChecklist.find((item) => item?.organizationUuid === selectedOrganizationUuid) ??
      null;

    setOnboardingChecklist(targetOnboardingChecklist);
  };

  useEffect(() => {
    if (!agentsmithUser) {
      return;
    }

    const getUnreadAlerts = async () => {
      const alertsService = new AlertsService({
        supabase,
      });

      const count = await alertsService.getUnreadAlertsCount();

      setUnreadAlertsCount(count ?? 0);
    };

    const channelId = `agentsmith-events-user-${agentsmithUser.id}`;

    const channel = supabase
      .channel(channelId)
      .on<Database['public']['Tables']['agentsmith_events']['Row']>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agentsmith_events',
          filter: `created_by=eq.${agentsmithUser.id}`,
        },
        handleAgentsmithEvent(selectedProject),
      )
      .subscribe();

    getUnreadAlerts();
    getOnboardingChecklist();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, agentsmithUser?.id, selectedProject?.name]);

  const setSelectedOrganizationUuid = (uuid: string) => {
    _setSelectedOrganizationUuid(uuid);

    const targetOrganization =
      userOrganizationData?.organization_users?.find(
        (orgUser) => orgUser.organizations.uuid === uuid,
      )?.organizations ?? null;

    if (!targetOrganization) {
      redirect(routes.error('Cannot select organization, user is not a member.'));
    }

    setIsOrganizationAdmin(
      userOrganizationData?.organization_users?.some(
        (orgUser) => orgUser.organizations.uuid === uuid && orgUser.role === 'ADMIN',
      ),
    );

    setSelectedOrganization(targetOrganization);
    router.push(routes.studio.organization(uuid));
  };

  const setSelectedProjectUuid = (uuid: string) => {
    _setSelectedProjectUuid(uuid);

    const targetProject =
      selectedOrganization?.projects.find((project) => project.uuid === uuid) ?? null;

    if (!targetProject) {
      redirect(routes.error('Cannot select project, user does not have access.'));
    }

    setSelectedProject(targetProject);
    router.push(routes.studio.project(uuid));
  };

  const showSyncTooltip = () => {
    if (isSyncTooltipVisible) return;

    const isGithubAppInstalled = selectedOrganization?.github_app_installations.some(
      (installation) => installation.status === 'ACTIVE',
    );

    if (!isGithubAppInstalled) return;

    setIsSyncTooltipVisible(true);

    setTimeout(() => {
      setIsSyncTooltipVisible(false);
    }, 3000);
  };

  const value = useMemo(
    () => ({
      selectedOrganizationUuid,
      selectedProjectUuid,
      setSelectedOrganizationUuid,
      setSelectedProjectUuid,
      selectedOrganization,
      selectedProject,
      userOrganizationData,
      hasOpenRouterKey,
      isOrganizationAdmin,
      showSyncTooltip,
      isSyncTooltipVisible,
      unreadAlertsCount,
      setUnreadAlertsCount,
      onboardingChecklist,
      setOnboardingChecklist,
      userNeedsOrgMembership,
      orgTierInfo,
    }),
    [
      selectedOrganizationUuid,
      selectedProjectUuid,
      selectedOrganization,
      selectedProject,
      userOrganizationData,
      hasOpenRouterKey,
      isOrganizationAdmin,
      showSyncTooltip,
      isSyncTooltipVisible,
      unreadAlertsCount,
      setUnreadAlertsCount,
      onboardingChecklist,
      setOnboardingChecklist,
      userNeedsOrgMembership,
      orgTierInfo,
    ],
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
