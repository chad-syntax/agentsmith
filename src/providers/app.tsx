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
import type { GetUserOrganizationDataResult } from '@/lib/UsersService';
import { useAuth } from './auth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/app/__generated__/supabase.types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SyncProjectButton } from '@/components/sync-project-button';
import { AlertsService } from '@/lib/AlertsService';

type Organization = GetUserOrganizationDataResult['organization_users'][number]['organizations'];
type Project = Organization['projects'][number];

type ShowSyncToastOptions = {
  title: string;
  description?: string;
};

type AppContextType = {
  selectedOrganizationUuid: string;
  selectedProjectUuid: string;
  setSelectedOrganizationUuid: (uuid: string) => void;
  setSelectedProjectUuid: (uuid: string) => void;
  selectedOrganization: Organization;
  selectedProject: Project;
  userOrganizationData: GetUserOrganizationDataResult;
  hasOpenRouterKey: boolean;
  isOrganizationAdmin: boolean;
  showSyncToast: (options: ShowSyncToastOptions) => void;
  unreadAlertsCount: number;
  setUnreadAlertsCount: Dispatch<SetStateAction<number>>;
};

const AppContext = createContext<AppContextType>({
  selectedOrganizationUuid: '',
  selectedProjectUuid: '',
  setSelectedOrganizationUuid: () => {},
  setSelectedProjectUuid: () => {},
  selectedOrganization: {} as Organization,
  selectedProject: {} as Project,
  userOrganizationData: {} as GetUserOrganizationDataResult,
  hasOpenRouterKey: false,
  isOrganizationAdmin: false,
  showSyncToast: () => {},
  unreadAlertsCount: 0,
  setUnreadAlertsCount: () => {},
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

  const initialSelectedOrganization =
    userOrganizationData.organization_users.find(
      (orgUser) => orgUser.organizations.uuid === initialSelectedOrganizationUuid,
    )?.organizations ?? userOrganizationData.organization_users[0].organizations;

  const initialSelectedProject =
    initialSelectedOrganization?.projects.find(
      (project) => project.uuid === initialSelectedProjectUuid,
    ) ?? initialSelectedOrganization?.projects[0];

  const [selectedOrganization, setSelectedOrganization] = useState<Organization>(
    initialSelectedOrganization,
  );
  const [selectedProject, setSelectedProject] = useState<Project>(initialSelectedProject);

  const hasOpenRouterKey =
    selectedOrganization?.organization_keys.some(
      (key) => key.key === ORGANIZATION_KEYS.OPENROUTER_API_KEY,
    ) ?? false;

  const initialIsOrganizationAdmin = userOrganizationData.organization_users.some(
    (orgUser) =>
      orgUser.organizations.uuid === selectedOrganizationUuid && orgUser.role === 'ADMIN',
  );

  const [isOrganizationAdmin, setIsOrganizationAdmin] = useState(initialIsOrganizationAdmin);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  const callToast = () => toast;

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
        (payload) => {
          const record = payload.new;

          switch (record.type) {
            case 'SYNC_START':
              const syncStartedToastId = callToast()('Sync Started', {
                description: `Sync started for project ${selectedProject?.name ?? '...'}`,
                action: (
                  <Button
                    asChild
                    size="sm"
                    variant="link"
                    className="ml-auto"
                    onClick={() => {
                      callToast().dismiss(syncStartedToastId);
                    }}
                  >
                    <Link
                      href={routes.studio.eventDetail(selectedProject?.uuid ?? '', record.uuid)}
                    >
                      Details
                    </Link>
                  </Button>
                ),
              });
              break;
            case 'SYNC_COMPLETE':
              const syncCompletedToastId = callToast().success('Sync Completed', {
                description: `Sync finished successfully for project ${selectedProject?.name ?? '...'}`,
                action: (
                  <Button
                    asChild
                    size="sm"
                    variant="link"
                    className="ml-auto"
                    onClick={() => {
                      callToast().dismiss(syncCompletedToastId);
                    }}
                  >
                    <Link
                      href={routes.studio.eventDetail(selectedProject?.uuid ?? '', record.uuid)}
                    >
                      Details
                    </Link>
                  </Button>
                ),
              });
              break;
            case 'SYNC_ERROR':
              const syncErrorToastId = callToast().error('Sync Failed', {
                description: `Sync failed for project ${selectedProject?.name ?? '...'}. Check logs for details.`,
                duration: 10000,
                action: (
                  <Button
                    asChild
                    variant="destructive"
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                      callToast().dismiss(syncErrorToastId);
                    }}
                  >
                    <Link
                      href={routes.studio.eventDetail(selectedProject?.uuid ?? '', record.uuid)}
                    >
                      View
                    </Link>
                  </Button>
                ),
              });
              break;
            default:
              break;
          }
        },
      )
      .subscribe();

    getUnreadAlerts();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, agentsmithUser?.id, selectedProject?.name, callToast]);

  const setSelectedOrganizationUuid = (uuid: string) => {
    _setSelectedOrganizationUuid(uuid);

    const targetOrganization =
      userOrganizationData.organization_users.find((orgUser) => orgUser.organizations.uuid === uuid)
        ?.organizations ?? null;

    if (!targetOrganization) {
      redirect(routes.error('Cannot select organization, user is not a member.'));
    }

    setIsOrganizationAdmin(
      userOrganizationData.organization_users.some(
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

  const showSyncToast = (options: ShowSyncToastOptions) => {
    const { title, description } = options;

    const isGithubAppInstalled = selectedOrganization?.github_app_installations.some(
      (installation) => installation.status === 'ACTIVE',
    );

    if (isGithubAppInstalled) {
      const toastId = callToast()(title, {
        description: description ?? 'Would you like to sync your project?',
        duration: 6000,
        action: (
          <SyncProjectButton
            projectUuid={selectedProjectUuid}
            onSyncComplete={() => {
              callToast().dismiss(toastId);
            }}
          />
        ),
      });
    }
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
      showSyncToast,
      unreadAlertsCount,
      setUnreadAlertsCount,
    }),
    [
      selectedOrganizationUuid,
      selectedProjectUuid,
      selectedOrganization,
      selectedProject,
      userOrganizationData,
      hasOpenRouterKey,
      isOrganizationAdmin,
      showSyncToast,
      unreadAlertsCount,
      setUnreadAlertsCount,
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
