import { routes } from '@/utils/routes';
import { H1, P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { GetUserOrganizationDataResult } from '@/lib/UsersService';

type StudioPageProps = {
  userOrganizationData: NonNullable<GetUserOrganizationDataResult>;
};

export const StudioPage = (props: StudioPageProps) => {
  const { userOrganizationData } = props;

  return (
    <div>
      <H1>Studio Home</H1>
      <div className="mt-6">
        {userOrganizationData.organization_users.length === 0 ? (
          <P>You don't have any organizations yet.</P>
        ) : (
          <div className="flex flex-col gap-6">
            {userOrganizationData.organization_users.map((orgUser) => (
              <div key={orgUser.organizations.uuid} className="border rounded-md p-4 bg-background">
                <Button
                  variant="link"
                  asChild
                  className="text-xl font-semibold text-primary hover:underline p-0"
                >
                  <a href={routes.studio.organization(orgUser.organizations.uuid)}>
                    {orgUser.organizations.name}
                  </a>
                </Button>

                <div className="mt-2 ml-4">
                  {orgUser.organizations.projects.length === 0 ? (
                    <P className="text-muted-foreground italic">No projects</P>
                  ) : (
                    <ul className="space-y-1">
                      {orgUser.organizations.projects.map((project) => (
                        <li key={project.uuid}>
                          <Button
                            variant="link"
                            asChild
                            className="text-primary hover:underline p-0"
                          >
                            <a href={routes.studio.project(project.uuid)}>{project.name}</a>
                          </Button>
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
