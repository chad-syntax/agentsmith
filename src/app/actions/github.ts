'use server';

import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const installGithubApp = async (organizationUuid: string) => {
  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const { uuid: installationRecordUuid } =
    await agentsmith.services.github.createAppInstallationRecord(organizationUuid);

  const installUrl = agentsmith.services.github.getInstallationUrl({
    organizationUuid,
    installationRecordUuid,
  });

  redirect(installUrl);
};

export const syncProject = async (projectUuid: string) => {
  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  await agentsmith.services.github.syncRepository(projectUuid);
};
