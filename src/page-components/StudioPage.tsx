import { routes } from '@/utils/routes';
import { H1, H3, P } from '@/components/typography';
import { GetOnboardingChecklistResult, GetUserOrganizationDataResult } from '@/lib/UsersService';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingChecklist } from '@/components/onboarding-checklist';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type StudioPageProps = {
  userOrganizationData: NonNullable<GetUserOrganizationDataResult>;
  onboardingChecklist: GetOnboardingChecklistResult;
};

export const StudioPage = (props: StudioPageProps) => {
  const { userOrganizationData, onboardingChecklist } = props;

  return (
    <div className="p-4">
      <div className="flex justify-start items-start gap-2">
        <H1 className="mb-6 relative">Agentsmith Studio</H1>
        <span className="text-xs tracking-wider font-light">ALPHA</span>
      </div>
      <Alert>
        <AlertTitle className="text-lg font-semibold">
          👋 Hello, Thank you for trying Agentsmith!
        </AlertTitle>
        <AlertDescription>
          <P>
            Making this app as bitchin' as possible is my top priority. Click the Feedback button at
            the bottom-right corner at any time, or reach out to{' '}
            <a className="underline" href={routes.emails.alex}>
              alex@agentsmith.app
            </a>{' '}
            <br />
            Also make sure to ⭐️ the repo on{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              href={routes.external.github}
            >
              GitHub!
            </a>
          </P>
        </AlertDescription>
      </Alert>
      <div className="mt-6">
        {userOrganizationData.organization_users.length === 0 ? (
          <P>You don't have any organizations yet.</P>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userOrganizationData.organization_users.map((orgUser) => {
              const onboardingChecklistItem = onboardingChecklist.find(
                (item) => item?.organizationUuid === orgUser.organizations.uuid,
              );

              const onboardingComplete = Object.values(onboardingChecklistItem ?? {}).every(
                (item) => item,
              );

              return (
                <Card
                  key={orgUser.organizations.uuid}
                  className="transition-shadow hover:shadow-lg group"
                >
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">
                      <Link
                        href={routes.studio.organization(orgUser.organizations.uuid)}
                        className="text-primary hover:underline"
                      >
                        {orgUser.organizations.name}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orgUser.organizations.projects.length === 0 ? (
                      <P className="text-muted-foreground italic">No projects</P>
                    ) : (
                      <ul className="space-y-1">
                        {orgUser.organizations.projects.map((project) => (
                          <li key={project.uuid}>
                            <Link
                              href={routes.studio.project(project.uuid)}
                              className="text-primary hover:underline p-0 text-base font-medium"
                            >
                              {project.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                  {orgUser.role === 'ADMIN' && onboardingChecklistItem && !onboardingComplete && (
                    <CardContent>
                      <OnboardingChecklist
                        defaultProjectUuid={orgUser.organizations.projects[0]?.uuid}
                        onboardingChecklistItem={onboardingChecklistItem}
                      />
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
