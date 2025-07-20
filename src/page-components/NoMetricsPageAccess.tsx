import { H1, P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GetOrganizationTierDataResult } from '@/lib/OrganizationsService';
import { routes } from '@/utils/routes';
import Link from 'next/link';

type NoMetricsPageAccessProps = {
  organizationTier: NonNullable<GetOrganizationTierDataResult>;
};

export const NoMetricsPageAccess = (props: NoMetricsPageAccessProps) => {
  const { organizationTier } = props;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md">
        <Card className="p-8 flex flex-col items-center gap-6 mx-4">
          <H1 className="text-center">No Metrics Page Access</H1>
          <P className="text-center">
            The metrics page is not included in your {organizationTier.name} plan. Please upgrade to
            a higher plan to access the metrics page.
          </P>
          <Link href={routes.studio.organizationBilling(organizationTier.organizations[0].uuid)}>
            <Button>Upgrade</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};
