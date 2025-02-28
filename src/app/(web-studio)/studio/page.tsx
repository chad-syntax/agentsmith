import { getUserOrganizationData } from '@/lib/onboarding';
import { StudioHomePage } from '@/page-components/StudioHomePage';

export default async function WebStudioHome() {
  const userOrganizationData = await getUserOrganizationData();

  return <StudioHomePage userOrganizationData={userOrganizationData} />;
}
