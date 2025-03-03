import { getOrganizationData } from '@/lib/organization';
import { createClient } from '@/lib/supabase/server';
import { OrganizationPage } from '@/page-components/OrganizationPage';

type OrganizationProps = {
  params: Promise<{ organizationUuid: string }>;
};

export default async function Organization(props: OrganizationProps) {
  const { organizationUuid } = await props.params;

  const organization = await getOrganizationData(organizationUuid);

  return <OrganizationPage organization={organization} />;
}
