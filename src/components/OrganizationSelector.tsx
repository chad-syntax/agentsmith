import { useApp } from '@/app/providers/app';
import type { GetUserOrganizationDataResult } from '@/lib/onboarding';

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
    isLoading,
  } = useApp();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const organizations =
    userOrganizationData?.organization_users?.flatMap((orgUser: any) =>
      orgUser.organizations ? [orgUser.organizations] : []
    ) || [];

  const hasOrganizations = organizations.length > 0;
  const hasProjects = (selectedOrganization?.projects.length ?? 0) > 0;

  return (
    <div>
      {hasOrganizations && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization
          </label>
          <div className="relative">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedOrganizationUuid ?? 'choose-organization'}
              onChange={(e) => setSelectedOrganizationUuid(e.target.value)}
            >
              <option disabled value="choose-organization">
                Choose Organization
              </option>
              {organizations.map((org: any) => (
                <option key={org.uuid} value={org.uuid}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {hasOrganizations && selectedOrganizationUuid && hasProjects && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project
          </label>
          <div className="relative">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedProjectUuid ?? 'choose-project'}
              onChange={(e) => setSelectedProjectUuid(e.target.value)}
            >
              <option disabled value="choose-project">
                Choose Project
              </option>
              {selectedOrganization?.projects.map((project: any) => (
                <option key={project.uuid} value={project.uuid}>
                  {`Project ${project.name}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
