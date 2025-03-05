import { useApp } from '@/app/providers/app';
import type { GetUserOrganizationDataResult } from '@/lib/onboarding';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type OrganizationSelectorProps = {
  userOrganizationData: GetUserOrganizationDataResult;
};

export const OrganizationSelector = (props: OrganizationSelectorProps) => {
  const { userOrganizationData } = props;

  const {
    selectedOrganizationUuid,
    setSelectedOrganizationUuid,
    selectedOrganization,
    selectedProjectUuid,
    setSelectedProjectUuid,
  } = useApp();

  const organizations =
    userOrganizationData?.organization_users?.flatMap((orgUser: any) =>
      orgUser.organizations ? [orgUser.organizations] : []
    ) || [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Organization</Label>
        <Select
          value={selectedOrganizationUuid ?? 'choose-organization'}
          onValueChange={setSelectedOrganizationUuid}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose Organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org: any) => (
              <SelectItem key={org.uuid} value={org.uuid}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Project</Label>
        <Select
          value={selectedProjectUuid ?? 'choose-project'}
          onValueChange={setSelectedProjectUuid}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose Project" />
          </SelectTrigger>
          <SelectContent>
            {selectedOrganization?.projects.map((project: any) => (
              <SelectItem key={project.uuid} value={project.uuid}>
                {`Project ${project.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
