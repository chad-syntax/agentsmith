import { getOrganization } from '@/lib/organization';
import { OrganizationPage } from '@/page-components/OrganizationPage';

type OrganizationProps = {
  params: Promise<{ organizationUuid: string }>;
};

export default async function Organization(props: OrganizationProps) {
  const { organizationUuid } = await props.params;

  const organization = await getOrganization(organizationUuid);

  return <OrganizationPage organization={organization} />;
}
