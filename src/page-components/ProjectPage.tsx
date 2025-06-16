'use client';

import { FileCode, Pencil, Copy, Info, Terminal } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { H1, H3 } from '@/components/typography';
import { GetProjectDataResult } from '@/lib/ProjectsService';
import { GlobalsList } from '@/components/project/GlobalsList';
import { SyncStatusAlert } from '@/components/sync-status-alert';
import { ConnectProjectModal } from '@/components/modals/connect-project';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateTypes } from '@/app/actions/generate-types';
import { fileDownload } from '@/utils/file-download';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApiKeyReveal } from '@/components/api-key-reveal';
import { TypescriptEditor } from '@/components/editors/typescript-editor';

export type ProjectPageProps = {
  projectData: NonNullable<GetProjectDataResult>;
};

export const ProjectPage = (props: ProjectPageProps) => {
  const { projectData } = props;

  const [connectProjectModalOpen, setConnectProjectModalOpen] = useState(false);

  const handleDownloadTypesClick = async () => {
    const response = await generateTypes(projectData.id);
    if (response.success && response.data) {
      try {
        fileDownload({
          content: response.data.content,
          filename: response.data.filename,
          type: 'text/typescript',
        });
      } catch (error) {
        console.error(error);
        toast.error('Failed to download types, please try again or contact support.');
      }
    } else if (response.success && !response.data) {
      toast.error('No types were generated, please try again or contact support.');
    } else {
      toast.error('Failed to generate types, please try again or contact support.');
    }
  };

  const handleCopyProjectId = async () => {
    try {
      await navigator.clipboard.writeText(projectData.uuid);
      toast.success('Project ID Copied 👍');
    } catch (err) {
      console.error('Failed to copy project ID: ', err);
      toast.error('Failed to copy Project ID');
    }
  };

  const sampleSdkCodeContent = `
// src/file.ts
import { AgentsmithClient } from '@agentsmith/sdk';
import { Agency } from '../agentsmith/agentsmith.types';

const agentsmithClient = new AgentsmithClient<Agency>('sdk_********************************', '${projectData.uuid}');

const helloWorldPrompt = agentsmithClient.getPrompt('hello-world@0.0.1');

const compiledPrompt = helloWorldPrompt.compile({
  name: 'John',
});
`;

  const isConnected =
    projectData.project_repositories && projectData.project_repositories.length > 0;

  const hasPrompts = projectData.prompts && projectData.prompts.length > 0;

  return (
    <>
      <ConnectProjectModal
        open={connectProjectModalOpen}
        onOpenChange={(open) => {
          setConnectProjectModalOpen(open);
        }}
      />
      <div className="p-6">
        <div className="flex gap-4 justify-start items-center mb-4">
          <H1>{projectData.name}</H1>
          <Link href={routes.studio.editProject(projectData.uuid)}>
            <Pencil className="w-6 h-6 text-muted-foreground" />
          </Link>
        </div>
        {isConnected && (
          <div className="mb-4 text-muted-foreground">
            {projectData.name} connected to{' '}
            <a
              href={routes.github.repository(
                projectData.project_repositories[0].repository_full_name,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              {projectData.project_repositories[0].repository_full_name}
            </a>{' '}
            with default branch{' '}
            <a
              href={routes.github.branch(
                projectData.project_repositories[0].repository_full_name,
                projectData.project_repositories[0].repository_default_branch,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              {projectData.project_repositories[0].repository_default_branch}
            </a>{' '}
            using folder{' '}
            <span className="bg-muted-foreground text-muted px-1.5 py-0.5 rounded-xs font-mono">
              {projectData.project_repositories[0].agentsmith_folder}
            </span>
            .
          </div>
        )}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <SyncStatusAlert isConnected={isConnected} events={projectData.agentsmith_events} />
          </div>
          {hasPrompts && (
            <div>
              <Alert variant="default">
                <Info size={16} />
                <AlertTitle>Types</AlertTitle>
                <AlertDescription>
                  Prompt Types will automatically be written to your agentsmith folder during a
                  Sync, or you can download them here.
                  <Button
                    onClick={handleDownloadTypesClick}
                    size="lg"
                    className="mt-2 bg-green-500 hover:bg-green-600 flex items-center gap-2"
                  >
                    <FileCode size={16} />
                    Download Types
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}
          {hasPrompts && (
            <div>
              <H3>Prompts</H3>
              <ul className="list-disc list-inside mt-2 mb-4">
                {projectData.prompts.map((prompt) => (
                  <li key={prompt.uuid}>
                    <Link
                      href={routes.studio.promptDetail(projectData.uuid, prompt.uuid)}
                      className="underline hover:text-primary"
                    >
                      {prompt.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="mt-6">
          <H3>Getting Started with Agentsmith SDK</H3>
          <Alert variant="default" className="mt-2">
            <Info size={16} />
            <AlertTitle>1. Installation</AlertTitle>
            <AlertDescription>
              <div className="text-xs">
                During alpha phase we are only building the SDK to github branches, npm registry
                coming soon!
              </div>
              Install the Agentsmith SDK via npm:
              <div className="flex items-center gap-1 mt-2">
                <div className="font-mono bg-muted p-2 rounded-md flex items-center gap-2">
                  <Terminal size={16} className="inline-block mr-2" />
                  <span>
                    npm install
                    git+ssh://git@github.com/chad-syntax/agentsmith.git#sdk-release-prod@0.0.1
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      'npm install git+ssh://git@github.com/chad-syntax/agentsmith.git#sdk-release-prod@0.0.1',
                    );
                    toast.success('Copied code to clipboard');
                  }}
                  className="hover:text-primary"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </AlertDescription>
            {/* <AlertDescription>
              Install the Agentsmith SDK using npm or yarn:
              <div className="mt-2 font-mono bg-muted p-2 rounded-md">
                <Terminal size={16} className="inline-block mr-2" />
                npm install @agentsmith/sdk
              </div>
            </AlertDescription> */}
          </Alert>
          <Alert variant="default" className="mt-4">
            <Info size={16} />
            <AlertTitle>2. Get Your API Key and Project ID</AlertTitle>
            <AlertDescription>
              Get your API key from below or the organization settings page:
              <div className="my-2">
                <ApiKeyReveal
                  organizationUuid={projectData.organizations?.uuid || ''}
                  keyName="SDK_API_KEY"
                />
              </div>
              <div className="text-sm flex justify-start items-stretch bg-muted border rounded-md">
                <div className="font-semibold border-r dark:border-r-muted-foreground/60 px-2 flex items-center">
                  Project ID
                </div>
                <div className="px-4 font-mono border-r dark:border-r-muted-foreground/60 flex items-center">
                  {projectData.uuid}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyProjectId}
                  className="hover:text-primary"
                >
                  <Copy className="w-4 h-4 hover:text-primary" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
          <Alert variant="default" className="mt-4">
            <Info size={16} />
            <AlertTitle>3. Usage</AlertTitle>
            <AlertDescription>
              Initialize the SDK with your API key and project ID:
              <div className="relative w-full">
                <div className="absolute top-0 right-0 z-10">
                  <Button
                    variant="ghost"
                    className="cursor-pointer"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(sampleSdkCodeContent);
                      toast.success('Copied code to clipboard');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <TypescriptEditor
                  value={sampleSdkCodeContent}
                  onValueChange={() => {}}
                  disabled
                  className="w-full"
                  padding={0}
                />
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <H3 className="mt-6">Global Context</H3>
        <GlobalsList globalContext={projectData.global_contexts?.content} />
      </div>
    </>
  );
};
