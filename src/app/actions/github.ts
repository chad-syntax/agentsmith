'use server';

import { redirect } from 'next/navigation';

export const installGithubApp = async (organizationUuid: string) => {
  const githubAppName = process.env.GITHUB_APP_NAME;

  if (!githubAppName) {
    throw new Error('GITHUB_APP_NAME is not defined, cannot connect to GitHub');
  }

  const githubAppUrl = `https://github.com/apps/${githubAppName}/installations/new?state=${organizationUuid}`;
  redirect(githubAppUrl);
};
