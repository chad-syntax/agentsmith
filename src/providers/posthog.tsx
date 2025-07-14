'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PostHogProviderComponent } from 'posthog-js/react';
import { isDev } from '@/utils/is-env';

const hasPostHogEnvVars =
  process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (typeof window !== 'undefined') {
  if (hasPostHogEnvVars) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    });
  } else {
    console.warn('No PostHog environment variables found, cannot initialize PostHog');
  }
}

type PostHogProviderProps = {
  children: React.ReactNode;
};

export const PostHogProvider = (props: PostHogProviderProps) => {
  const { children } = props;

  if (isDev) return children;

  return <PostHogProviderComponent client={posthog}>{children}</PostHogProviderComponent>;
};
