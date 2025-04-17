'use server';

import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const githubAppName = process.env.GITHUB_APP_NAME;

export const installGithubApp = async (organizationUuid: string) => {
  if (!githubAppName) {
    throw new Error('GITHUB_APP_NAME is not defined, cannot connect to GitHub');
  }

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  await agentsmith.services.github.createAppInstallationRecord(organizationUuid);

  const githubAppUrl = `https://github.com/apps/${githubAppName}/installations/new?state=${organizationUuid}`;

  redirect(githubAppUrl);
};
