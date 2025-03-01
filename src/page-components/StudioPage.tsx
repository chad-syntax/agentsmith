import { GetUserOrganizationDataResult } from '@/lib/onboarding';
import { routes } from '@/utils/routes';
type StudioPageProps = {
  userOrganizationData: GetUserOrganizationDataResult;
};

export const StudioPage = (props: StudioPageProps) => {
  const { userOrganizationData } = props;

  return (
    <div>
      <h1>Studio Home</h1>
      <div className="mt-6">
        {userOrganizationData.organization_users.length === 0 ? (
          <p>You don't have any organizations yet.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {userOrganizationData.organization_users.map((orgUser) => (
              <div
                key={orgUser.organizations.uuid}
                className="border rounded-md p-4"
              >
                <a
                  href={routes.studio.organization(orgUser.organizations.uuid)}
                  className="text-xl font-semibold text-blue-600 hover:underline"
                >
                  {orgUser.organizations.name}
                </a>

                <div className="mt-2 ml-4">
                  {orgUser.organizations.projects.length === 0 ? (
                    <p className="text-gray-500 italic">No projects</p>
                  ) : (
                    <ul className="space-y-1">
                      {orgUser.organizations.projects.map((project) => (
                        <li key={project.uuid}>
                          <a
                            href={routes.studio.project(project.uuid)}
                            className="text-blue-500 hover:underline"
                          >
                            {project.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
