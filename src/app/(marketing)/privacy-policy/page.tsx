import { PrivacyPolicyPage } from '@/page-components/PrivacyPolicyPage';

export const metadata = {
  title: 'Privacy Policy',
  description: 'The Agentsmith Privacy Policy.',
  alternates: {
    canonical: '/privacy-policy',
  },
};

export default function PrivacyPolicy() {
  return <PrivacyPolicyPage />;
}
