import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { OrganizationBillingPage } from '@/page-components/OrganizationBillingPage';
import { notFound } from 'next/navigation';

type OrganizationBillingProps = {
  params: Promise<{ organizationUuid: string }>;
};

export default async function OrganizationBilling(props: OrganizationBillingProps) {
  const { organizationUuid } = await props.params;

  const supabase = await createClient();
  const agentsmith = new AgentsmithServices({ supabase });

  const organization =
    await agentsmith.services.organizations.getOrganizationData(organizationUuid);

  if (!organization) {
    return notFound();
  }

  return <OrganizationBillingPage organization={organization} />;
}
