'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PostHogProviderComponent } from 'posthog-js/react';
import { isDev } from '@/utils/is-env';
import { useEffect } from 'react';

type PostHogProviderProps = {
  children: React.ReactNode;
};

export const PostHogProvider = (props: PostHogProviderProps) => {
  const { children } = props;

  useEffect(() => {
    const hasPostHogEnvVars =
      process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (hasPostHogEnvVars && !isDev) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
      });
    }
  }, []);

  return <PostHogProviderComponent client={posthog}>{children}</PostHogProviderComponent>;
};
