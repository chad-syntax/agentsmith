import { SignInForm } from '@/components/sign-in-form';
import { H1 } from '@/components/typography';
import Link from 'next/link';
import { routes } from '@/utils/routes';

type AuthPageProps = {
  pageType: 'sign-in' | 'sign-up';
};

export const AuthPage = ({ pageType }: AuthPageProps) => (
  <div className="container mt-16 md:mt-32 mx-auto flex flex-col items-center">
    <H1 className="text-center mb-12">Agentsmith</H1>
    <div className="max-w-lg w-full px-4 md:px-8">
      <SignInForm requiredTos={pageType === 'sign-up'} />
    </div>
    <div>
      <div className="mt-8 grid grid-cols-5 text-sm text-center">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="flex items-center justify-center">|</span>
        <a href={routes.emails.support} className="hover:underline">
          Support
        </a>
        <span className="flex items-center justify-center">|</span>
        {pageType === 'sign-in' ? (
          <Link href={routes.auth.signUp} className="hover:underline">
            Sign Up
          </Link>
        ) : (
          <Link href={routes.auth.signIn} className="hover:underline">
            Sign In
          </Link>
        )}
      </div>
    </div>
  </div>
);
