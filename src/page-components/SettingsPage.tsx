'use client';

import { Database } from '@/app/__generated__/supabase.types';
import { installGithubApp } from '@/app/actions/github';
import { connectOpenrouter } from '@/app/actions/openrouter';
import { useApp } from '@/providers/app';
import { ApiKeyReveal } from '@/components/api-key-reveal';
import { ConnectProjectModal } from '@/components/modals/connect-project';
import { SyncProjectButton } from '@/components/sync-project-button';
import { H2, P } from '@/components/typography';
import { GetOrganizationDataResult } from '@/lib/OrganizationsService';
import { GetProjectRepositoriesForOrganizationResult } from '@/lib/OrganizationsService';
import { Button } from '@/components/ui/button';
import { routes } from '@/utils/routes';
import { Notebook, Plus } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

type SettingsPageProps = {
  organization: NonNullable<GetOrganizationDataResult>;
  githubAppInstallation: Database['public']['Tables']['github_app_installations']['Row'] | null;
  projectRepositories: GetProjectRepositoriesForOrganizationResult;
};

export const SettingsPage = (props: SettingsPageProps) => {
  const { organization, githubAppInstallation, projectRepositories } = props;

  const { hasOpenRouterKey, isOrganizationAdmin } = useApp();

  const [connectProjectModalOpen, setConnectProjectModalOpen] = useState(false);
  const [targetRepositoryId, setTargetRepositoryId] = useState<number | undefined>(undefined);

  return (
    <div className="p-4 flex flex-col gap-8">
      <div>
        <H2 className="mb-4">GitHub App Installation</H2>
        <P className="pb-4">
          {githubAppInstallation
            ? '✅ This organization has a GitHub App installation'
            : '❌ This organization does not have a GitHub App installation'}
        </P>
        {!isOrganizationAdmin ? (
          <P>
            You must be an admin to connect to GitHub. Please ask your organization admin to connect
            to GitHub.
          </P>
        ) : githubAppInstallation && !githubAppInstallation?.installation_id ? (
          <P>
            App installation process not completed, please uninstall and reinstall the GitHub App.
          </P>
        ) : githubAppInstallation?.installation_id ? (
          <Button variant="link" asChild className="text-xs p-0">
            <a
              href={routes.github.installation(githubAppInstallation.installation_id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              View your GitHub App Installation Settings
            </a>
          </Button>
        ) : (
          <Button onClick={() => installGithubApp(organization.uuid)}>Install GitHub App</Button>
        )}
      </div>
      {githubAppInstallation?.installation_id && (
        <div>
          <H2 className="mb-4">GitHub App Installation Repositories</H2>
          {projectRepositories.length > 0 ? (
            <div className="flex flex-col gap-2">
              <ConnectProjectModal
                open={connectProjectModalOpen}
                onOpenChange={(open) => {
                  setConnectProjectModalOpen(open);
                  if (!open) {
                    setTargetRepositoryId(undefined);
                  }
                }}
                projectRepositories={projectRepositories}
                defaultRepositoryId={targetRepositoryId}
              />
              {projectRepositories.map((projectRepository) => (
                <div key={projectRepository.id} className="flex items-center gap-2">
                  <Notebook />
                  <Button variant="link" asChild className="text-xs p-0">
                    <a
                      href={routes.github.repository(projectRepository.repository_full_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {projectRepository.repository_full_name}
                    </a>
                  </Button>
                  {projectRepository.projects ? (
                    <div className="text-xs flex items-center justify-center gap-2">
                      Connected to{' '}
                      <Button variant="link" asChild className="text-xs p-0">
                        <Link href={routes.studio.project(projectRepository.projects.uuid)}>
                          {projectRepository.projects.name}
                        </Link>
                      </Button>
                      <SyncProjectButton
                        className="ml-2"
                        projectUuid={projectRepository.projects!.uuid}
                      />
                    </div>
                  ) : (
                    <Button
                      className="text-xs text-primary hover:text-primary"
                      variant="outline"
                      onClick={() => {
                        setTargetRepositoryId(projectRepository.id);
                        setConnectProjectModalOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Connect to Project
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <P className="text-muted-foreground italic">
                No repositories accessible, please check your GitHub App installation permissions.
              </P>
              <Button variant="link" asChild className="text-xs p-0">
                <a
                  href={routes.github.installation(githubAppInstallation.installation_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View your GitHub App Installation Settings
                </a>
              </Button>
            </div>
          )}
        </div>
      )}
      <div>
        <H2 className="mb-4">Openrouter Account</H2>
        <P className="pb-4">
          {hasOpenRouterKey
            ? '✅ This organization has an Openrouter key'
            : '❌ This organization does not have an Openrouter key'}
        </P>
        {!isOrganizationAdmin ? (
          <P>
            You must be an admin to connect to Openrouter. Please ask your organization admin to
            connect to Openrouter.
          </P>
        ) : hasOpenRouterKey ? (
          <Button variant="link" asChild className="text-xs p-0">
            <a href={routes.openrouter.settingsKeys} target="_blank" rel="noopener noreferrer">
              View your keys in Openrouter
            </a>
          </Button>
        ) : (
          <Button onClick={() => connectOpenrouter(organization.uuid)}>Connect Openrouter</Button>
        )}
      </div>
      <div>
        <H2 className="mb-4">API Key</H2>
        <P className="pb-4">
          Use this API key to authenticate requests to the Agentsmith API from your applications.
        </P>
        <div className="mb-4">
          <ApiKeyReveal organizationUuid={organization.uuid} keyName="SDK_API_KEY" />
        </div>
        <P className="text-sm text-muted-foreground">
          This API key grants access to run prompts and other operations as your organization. Keep
          it secure and never expose it in client-side code.
        </P>
      </div>
    </div>
  );
};
