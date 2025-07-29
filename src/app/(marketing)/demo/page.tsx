import { DemoPage } from '@/page-components/DemoPage';

export const metadata = {
  title: 'Demo Video',
  description: 'Watch a demo of Agentsmith in action, or book a time to chat with us.',
  alternates: {
    canonical: '/demo',
  },
};

export default function Demo() {
  return <DemoPage />;
}
