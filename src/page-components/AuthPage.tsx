import { SignInForm } from '@/components/sign-in-form';
import { H1 } from '@/components/typography';
import Link from 'next/link';
import { routes } from '@/utils/routes';

export const AuthPage = () => (
  <div className="container mt-16 md:mt-32 mx-auto flex flex-col items-center">
    <H1 className="text-center mb-12">Agentsmith</H1>
    <div className="max-w-lg w-full px-4 md:px-8">
      <SignInForm />
    </div>
    <div>
      <div className="mt-8 flex gap-4 text-sm">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span>|</span>
        <a href={routes.emails.support} className="hover:underline">
          Support
        </a>
      </div>
    </div>
  </div>
);
