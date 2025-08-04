import { AgentsmithUser, AuthProvider } from '@/providers/auth';
import { AppProvider } from '@/providers/app';
import { cn } from '@/utils/shadcn';
import { StudioHeader } from '@/components/studio-header';
import { DesktopStudioSidebar } from '@/components/studio-sidebar';
import { StudioGiveFeedback } from '@/components/studio-give-feedback';
import { STUDIO_FULL_HEIGHT } from './constants';
import type { User } from '@supabase/supabase-js';
import type { GetUserOrganizationDataResult } from '@/lib/UsersService';
import { OnboardingChecklist } from '@/components/onboarding-checklist';

type StudioAppProps = {
  authUser: User;
  agentsmithUser: AgentsmithUser | null;
  selectedProjectUuid: string;
  selectedOrganizationUuid: string;
  userOrganizationData: GetUserOrganizationDataResult;
  children: React.ReactNode;
};

export const StudioApp = (props: StudioAppProps) => {
  const {
    authUser,
    agentsmithUser,
    selectedProjectUuid,
    selectedOrganizationUuid,
    userOrganizationData,
    children,
  } = props;

  return (
    <AuthProvider user={authUser} agentsmithUser={agentsmithUser ?? undefined}>
      <AppProvider
        selectedProjectUuid={selectedProjectUuid}
        selectedOrganizationUuid={selectedOrganizationUuid}
        userOrganizationData={userOrganizationData}
      >
        <StudioHeader />
        <div className={cn('md:flex relative', STUDIO_FULL_HEIGHT)}>
          <DesktopStudioSidebar />
          <main className="pl-0 md:pl-12 flex-1 overflow-auto">{children}</main>
          <StudioGiveFeedback />
          <OnboardingChecklist floating />
        </div>
      </AppProvider>
    </AuthProvider>
  );
};
