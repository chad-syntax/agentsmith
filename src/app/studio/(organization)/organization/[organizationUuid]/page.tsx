import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { OrganizationPage } from '@/page-components/OrganizationPage';
import { notFound } from 'next/navigation';

type OrganizationProps = {
  params: Promise<{ organizationUuid: string }>;
};

export default async function Organization(props: OrganizationProps) {
  const { organizationUuid } = await props.params;

  const supabase = await createClient();
  const agentsmith = new AgentsmithServices({ supabase });

  const organization =
    await agentsmith.services.organizations.getOrganizationData(organizationUuid);
  if (!organization) {
    return notFound();
  }

  return <OrganizationPage organization={organization} />;
}
