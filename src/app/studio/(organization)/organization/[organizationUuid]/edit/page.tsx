import { OrganizationEditPage } from '@/page-components/OrganizationEditPage';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
type OrganizationEditProps = {
  params: Promise<{
    organizationUuid: string;
  }>;
};

export default async function OrganizationEdit(props: OrganizationEditProps) {
  const { organizationUuid } = await props.params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const organizationData =
    await agentsmith.services.organizations.getOrganizationData(
      organizationUuid
    );

  if (!organizationData) {
    return notFound();
  }

  return <OrganizationEditPage organizationData={organizationData} />;
}
