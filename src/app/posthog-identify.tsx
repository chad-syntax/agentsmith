'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { createClient } from '@/lib/supabase/client';
import { isProd } from '@/utils/is-env';

export const PostHogIdentify = () => {
  useEffect(() => {
    const initIdentify = async () => {
      const { data } = await createClient().auth.getSession();

      const githubIdentity = data.session?.user.identities?.find(
        (identity) => identity.provider === 'github',
      );

      if (data.session) {
        posthog.identify(data.session.user.id, {
          email: data.session.user.email,
          name: data.session.user.user_metadata.name,
          github_username: githubIdentity?.identity_data?.user_name,
        });
      }
    };
    if (isProd) {
      initIdentify();
    }
  }, []);
  return null;
};
