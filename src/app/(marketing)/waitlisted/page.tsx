import { WaitlistedPage } from '@/page-components/WaitlistedPage';

export const metadata = {
  title: 'Waitlisted',
  description: 'You are on the waitlist for Agentsmith.',
  alternates: {
    canonical: '/waitlisted',
  },
};

export default function Waitlisted() {
  return <WaitlistedPage />;
}
