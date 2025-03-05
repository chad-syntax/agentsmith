'use client';

import { signInWithGithub } from '@/app/providers/auth';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/submit-button';
import { FormMessage, Message } from '@/components/form-message';
import { signInAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { H1, P } from '@/components/typography';

type SignInPageProps = {
  searchParams: Message;
};

export const SignInPage = (props: SignInPageProps) => {
  const { searchParams } = props;

  return (
    <>
      <div>
        <Button onClick={signInWithGithub} variant="outline">
          Sign in with Github
        </Button>
      </div>
      <form className="flex-1 flex flex-col min-w-64">
        <H1>Sign in</H1>
        <P className="text-sm">
          Don't have an account?{' '}
          <Link
            className="text-foreground font-medium underline"
            href="/sign-up"
          >
            Sign up
          </Link>
        </P>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link
              className="text-xs text-foreground underline"
              href="/forgot-password"
            >
              Forgot Password?
            </Link>
          </div>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            required
          />
          <SubmitButton pendingText="Signing In..." formAction={signInAction}>
            Sign in
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
    </>
  );
};
