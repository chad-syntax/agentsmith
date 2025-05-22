import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { H1, H3 } from '@/components/typography';
import { GetProjectDataResult } from '@/lib/ProjectsService';
import { GlobalsList } from '@/components/project/GlobalsList';
import { SyncStatusAlert } from '@/components/sync-status-alert';

export type ProjectPageProps = {
  projectData: NonNullable<GetProjectDataResult>;
};

export const ProjectPage = (props: ProjectPageProps) => {
  const { projectData } = props;

  return (
    <div className="p-6">
      <div className="flex gap-2 justify-start items-center mb-8">
        <H1>{projectData.name}</H1>
        <Link href={routes.studio.editProject(projectData.uuid)}>
          <Pencil className="w-6 h-6 text-muted-foreground" />
        </Link>
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
          <span className="bg-muted-foreground text-muted px-1.5 py-0.5 rounded-xs font-mono">
            {projectData.project_repositories[0].repository_default_branch}
          </span>{' '}
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
          <H3>Prompts</H3>
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
  );
};
