import { DashboardSidebar } from '@/components/DashboardSidebar';
import { getOrganization } from '@/lib/organization';
import { getUserOrganizationData, isUserOnboarded } from '&/onboarding';
import { OrganizationPage } from '@/page-components/OrganizationPage';
import { AppProvider } from '@/app/providers/app';

type OrganizationProps = {
  params: Promise<{ organizationUuid: string }>;
};

export default async function Organization(props: OrganizationProps) {
  const { organizationUuid } = await props.params;

  const organization = await getOrganization(organizationUuid);

  // const userOrganizationData = await getUserOrganizationData();

  // const isOnboarded = isUserOnboarded(userOrganizationData);

  // const firstOrganizationProject = organization.projects[0];

  return <OrganizationPage organization={organization} />;

  // return (
  //   <div className="flex h-screen">
  //     <AppProvider
  //       selectedProjectUuid={firstOrganizationProject.uuid}
  //       selectedOrganizationUuid={organizationUuid}
  //       userOrganizationData={userOrganizationData}
  //     >
  //       <DashboardSidebar
  //         isOnboarded={isOnboarded}
  //         userOrganizationData={userOrganizationData}
  //       />
  //       <main className="flex-1 overflow-auto">
  //         <OrganizationPage organization={organization} />
  //       </main>
  //     </AppProvider>
  //   </div>
  // );
}
