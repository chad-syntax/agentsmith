import { getOnboardingData } from '&/onboarding';
import { WebStudioHomePage } from '@/page-components/WebStudioHomePage';

export default async function WebStudioHome() {
  const onboardingData = await getOnboardingData();

  return <WebStudioHomePage onboardingData={onboardingData} />;
}
