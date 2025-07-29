import { TermsOfServicePage } from '@/page-components/TermsOfServicePage';

export const metadata = {
  title: 'Terms of Service',
  description: 'The Agentsmith Terms of Service.',
  alternates: {
    canonical: '/terms-of-service',
  },
};

export default function TermsOfService() {
  return <TermsOfServicePage />;
}
