import {
  IconPrompt,
  IconList,
  IconUser,
  IconPencil,
} from '@tabler/icons-react';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { H1, H3, P } from '@/components/typography';
import { GetProjectDataResult } from '@/lib/ProjectsService';

export type ProjectPageProps = {
  projectData: NonNullable<GetProjectDataResult>;
};

export const ProjectPage = (props: ProjectPageProps) => {
  const { projectData } = props;

  return (
    <div className="p-6">
      <div className="flex gap-2 justify-start items-center mb-8">
        <H1>Project: {projectData.name}</H1>
        <Link href={routes.studio.editProject(projectData.uuid)}>
          <IconPencil className="w-6 h-6 text-muted-foreground" />
        </Link>
      </div>

      <main>
        {
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
            <Link
              href={routes.studio.prompts(projectData.uuid)}
              className="aspect-square bg-background rounded-xl shadow-xs hover:shadow-md transition-all hover:-translate-y-1 border p-4 flex flex-col"
            >
              <div className="flex items-center justify-center flex-1">
                <IconPrompt className="w-10 h-10 text-blue-500" />
              </div>
              <div className="mt-3">
                <H3 className="text-center">Prompts</H3>
                <P className="text-xs text-gray-500 text-center mt-0.5">
                  Manage your prompt library
                </P>
              </div>
            </Link>

            <Link
              href={routes.studio.logs(projectData.uuid)}
              className="aspect-square bg-background rounded-xl shadow-xs hover:shadow-md transition-all hover:-translate-y-1 border p-4 flex flex-col"
            >
              <div className="flex items-center justify-center flex-1">
                <IconList className="w-10 h-10 text-orange-500" />
              </div>
              <div className="mt-3">
                <H3 className="text-center">Logs</H3>
                <P className="text-xs text-gray-500 text-center mt-0.5">
                  View prompt execution logs
                </P>
              </div>
            </Link>

            <Link
              href={routes.studio.account}
              className="aspect-square bg-background rounded-xl shadow-xs hover:shadow-md transition-all hover:-translate-y-1 border p-4 flex flex-col"
            >
              <div className="flex items-center justify-center flex-1">
                <IconUser className="w-10 h-10 text-green-500" />
              </div>
              <div className="mt-3">
                <H3 className="text-center">Account</H3>
                <P className="text-xs text-gray-500 text-center mt-0.5">
                  Manage your account settings
                </P>
              </div>
            </Link>
          </div>
        }
      </main>
    </div>
  );
};
