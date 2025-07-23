import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { routes } from '@/utils/routes';
import { GetOrganizationDataResult } from '@/lib/OrganizationsService';

type OrganizationBillingSuccessPageProps = {
  organization: NonNullable<GetOrganizationDataResult>;
};

export const OrganizationBillingSuccessPage = (props: OrganizationBillingSuccessPageProps) => {
  const { organization } = props;

  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-4 items-center justify-center">
      <div className="flex flex-col gap-6 max-w-xl w-full items-center">
        <h1 className="text-3xl font-bold text-center">Success!</h1>
        <h3 className="text-xl text-muted-foreground text-center">
          {organization.name} has been upgraded.
        </h3>
        <div className="flex gap-4 mt-8">
          <Button asChild>
            <Link href={routes.studio.organizationBilling(organization.uuid)}>Back to Billing</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={routes.studio.organization(organization.uuid)}>Project Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export const OrganizationBillingSuccessPageSkeleton = () => {
  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-4 items-center justify-center">
      <div className="flex flex-col gap-6 max-w-xl w-full items-center">
        <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        <div className="h-6 w-64 bg-muted rounded animate-pulse" />
        <div className="flex gap-4 mt-8">
          <div className="h-10 w-36 bg-muted rounded animate-pulse" />
          <div className="h-10 w-36 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};
