import { AuthPage } from '@/page-components/AuthPage';

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your Agentsmith account.',
  alternates: {
    canonical: '/sign-in',
  },
};

export default function SignIn() {
  return <AuthPage pageType="sign-in" />;
}
