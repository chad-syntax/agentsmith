'use client';

import { FileCode, Pencil, Copy } from 'lucide-react';
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

  return (
    <>
      <ConnectProjectModal
        open={connectProjectModalOpen}
        onOpenChange={(open) => {
          setConnectProjectModalOpen(open);
        }}
      />
      <div className="p-6">
        <div className="flex gap-4 justify-start items-center mb-8">
          <H1>{projectData.name}</H1>
          <Link href={routes.studio.editProject(projectData.uuid)}>
            <Pencil className="w-6 h-6 text-muted-foreground" />
          </Link>
        </div>
        <div className="flex justify-start mb-4">
          <div className="text-sm flex justify-start items-stretch bg-muted border rounded-md">
            <div className="font-semibold border-r px-2 flex items-center">Project ID</div>
            <div className="px-4 font-mono border-r flex items-center">{projectData.uuid}</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyProjectId}
              className="hover:text-primary"
            >
              <Copy className="w-4 h-4 hover:text-primary" />
            </Button>
          </div>
        </div>

        {projectData.project_repositories && projectData.project_repositories.length > 0 && (
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
        <SyncStatusAlert events={projectData.agentsmith_events} />
        {projectData.prompts && projectData.prompts.length > 0 && (
          <div className="mt-6">
            <div className="flex gap-4 justify-between items-center">
              <H3>Prompts</H3>
              <Button
                onClick={handleDownloadTypesClick}
                className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
              >
                <FileCode size={16} />
                Download Types
              </Button>
            </div>
            <ul className="list-disc list-inside mt-2">
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
        <H3 className="mt-6">Global Context</H3>
        <GlobalsList globalContext={projectData.global_contexts?.content} />
      </div>
    </>
  );
};
