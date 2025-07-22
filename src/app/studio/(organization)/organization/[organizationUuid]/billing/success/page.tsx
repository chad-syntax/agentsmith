import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { OrganizationBillingSuccessPage } from '@/page-components/OrganizationBillingSuccessPage';
import { notFound } from 'next/navigation';

type OrganizationBillingSuccessProps = {
  params: Promise<{ organizationUuid: string }>;
};

export default async function OrganizationBillingSuccess(props: OrganizationBillingSuccessProps) {
  const { organizationUuid } = await props.params;

  const supabase = await createClient();
  const agentsmith = new AgentsmithServices({ supabase });

  const organization =
    await agentsmith.services.organizations.getOrganizationData(organizationUuid);

  if (!organization) {
    return notFound();
  }

  return <OrganizationBillingSuccessPage organization={organization} />;
}
