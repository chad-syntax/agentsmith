import { useApp } from '@/providers/app';
import { GetUserOrganizationDataResult } from '@/lib/UsersService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      orgUser.organizations ? [orgUser.organizations] : [],
    ) || [];

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Select
          value={selectedOrganizationUuid ?? 'choose-organization'}
          onValueChange={setSelectedOrganizationUuid}
        >
          <SelectTrigger className="truncate w-full">
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
        <Select
          value={selectedProjectUuid ?? 'choose-project'}
          onValueChange={setSelectedProjectUuid}
        >
          <SelectTrigger className="truncate w-full">
            <SelectValue placeholder="Choose Project" />
          </SelectTrigger>
          <SelectContent>
            {selectedOrganization?.projects.map((project: any) => (
              <SelectItem key={project.uuid} value={project.uuid}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
