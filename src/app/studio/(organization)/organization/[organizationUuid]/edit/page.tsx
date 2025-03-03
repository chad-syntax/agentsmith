import { OrganizationEditPage } from '@/page-components/OrganizationEditPage';
import { getOrganizationData } from '@/lib/organization';

type OrganizationEditProps = {
  params: Promise<{
    organizationUuid: string;
  }>;
};

export default async function OrganizationEdit(props: OrganizationEditProps) {
  const { organizationUuid } = await props.params;

  const organizationData = await getOrganizationData(organizationUuid);

  return <OrganizationEditPage organizationData={organizationData} />;
}
