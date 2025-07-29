import { AuthPage } from '@/page-components/AuthPage';

export const metadata = {
  title: 'Sign Up',
  description: 'Sign up for an Agentsmith account.',
  alternates: {
    canonical: '/sign-up',
  },
};

export default function SignUp() {
  return <AuthPage pageType="sign-up" />;
}
