'use client';

import { cn } from '@/utils/shadcn';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Github, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { signInAction } from '@/app/actions/auth';
import { SubmitButton } from './submit-button';
import { FormMessage, Message } from './form-message';
import { useSearchParams } from 'next/navigation';
import { isProd } from '@/utils/is-env';

export const SignInForm = ({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleSocialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome!</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSocialLogin}>
            <div className="flex flex-col gap-6">
              {error && <p className="text-sm text-destructive-500">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-foreground hover:bg-foreground/80 disabled:bg-foreground/50 text-md"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Github className="size-5" />
                    Continue with Github
                  </>
                )}
              </Button>
            </div>
          </form>
          {!isProd && (
            <form>
              <div className="flex items-center gap-2 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div>
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <SubmitButton
                    className="w-full"
                    pendingText="Signing In..."
                    formAction={signInAction}
                  >
                    Sign in
                  </SubmitButton>
                </div>
                <FormMessage message={Object.fromEntries(searchParams) as Message} />
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
