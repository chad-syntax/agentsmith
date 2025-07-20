import { PricingCards } from '@/components/marketing/pricing';
import { H2 } from '@/components/typography';
import { Badge } from '@/components/ui/badge';
import { GetOrganizationDataResult } from '@/lib/OrganizationsService';
import { Check, X } from 'lucide-react';

type OrganizationBillingPageProps = {
  organization: NonNullable<GetOrganizationDataResult>;
};

export const OrganizationBillingPage = (props: OrganizationBillingPageProps) => {
  const { organization } = props;

  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-4">
      <div className="flex flex-col gap-4">
        <H2>Plan Info</H2>
        <div className="flex items-center gap-4">
          <span className="font-medium">
            <Badge variant={organization.agentsmith_tiers.tier}>
              {organization.agentsmith_tiers.name}
            </Badge>
            &nbsp;Tier
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Prompt Limit</span>
            <span className="font-mono">
              {organization.agentsmith_tiers.prompt_limit === 9999
                ? 'Unlimited'
                : organization.agentsmith_tiers.prompt_limit}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">User Limit</span>
            <span className="font-mono">
              {organization.agentsmith_tiers.user_limit === 9999
                ? 'Unlimited'
                : organization.agentsmith_tiers.user_limit}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Project Limit</span>
            <span className="font-mono">{organization.agentsmith_tiers.project_limit}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">LLM Logs Limit</span>
            <span className="font-mono">{organization.agentsmith_tiers.llm_logs_limit}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">LLM Logs Retention (days)</span>
            <span className="font-mono">
              {organization.agentsmith_tiers.llm_logs_retention_days}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Metrics Page Access</span>
            <span className="font-mono">
              {organization.agentsmith_tiers.metrics_page_access ? <Check /> : <X />}
            </span>
          </div>
        </div>
      </div>
      <PricingCards />
    </div>
  );
};

export const OrganizationBillingPageSkeleton = () => (
  <div className="flex-1 w-full flex flex-col gap-12 p-4">
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {/* Title Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-6 w-20 bg-muted rounded animate-pulse" />
      </div>
      {/* Tier Badge Skeleton */}
      <div className="flex items-center gap-2 mt-2">
        <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
        <span className="h-4 w-10 bg-muted rounded animate-pulse ml-2" />
      </div>
      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
        {[...Array(6)].map((_, idx) => (
          <div className="flex flex-col gap-1" key={idx}>
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
