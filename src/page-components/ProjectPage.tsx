import { TerminalSquare, List, User, Pencil, Activity, Settings } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { H1, H3, P } from '@/components/typography';
import { GetProjectDataResult } from '@/lib/ProjectsService';
import { ElementType } from 'react';

export type ProjectPageProps = {
  projectData: NonNullable<GetProjectDataResult>;
};

type ProjectLink = {
  href: string;
  icon: ElementType;
  iconClassName: string;
  title: string;
  description: string;
};

export const ProjectPage = (props: ProjectPageProps) => {
  const { projectData } = props;

  const projectLinks: ProjectLink[] = [
    {
      href: routes.studio.prompts(projectData.uuid),
      icon: TerminalSquare,
      iconClassName: 'text-blue-500',
      title: 'Prompts',
      description: 'Manage your prompt library',
    },
    {
      href: routes.studio.logs(projectData.uuid),
      icon: List,
      iconClassName: 'text-orange-500',
      title: 'Logs',
      description: 'View prompt execution logs',
    },
    {
      href: routes.studio.events(projectData.uuid),
      icon: Activity,
      iconClassName: 'text-purple-500',
      title: 'Events',
      description: 'View project events and sync history',
    },
    {
      href: routes.studio.account,
      icon: User,
      iconClassName: 'text-green-500',
      title: 'Account',
      description: 'Manage your account settings',
    },
    {
      href: routes.studio.projectGlobals(projectData.uuid),
      icon: Settings,
      iconClassName: 'text-red-500',
      title: 'Globals',
      description: 'Manage project globals',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex gap-2 justify-start items-center mb-8">
        <H1>Project: {projectData.name}</H1>
        <Link href={routes.studio.editProject(projectData.uuid)}>
          <Pencil className="w-6 h-6 text-muted-foreground" />
        </Link>
      </div>

      <div>
        {
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
            {projectLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="aspect-square bg-background rounded-xl shadow-xs hover:shadow-md transition-all hover:-translate-y-1 border p-4 flex flex-col"
                >
                  <div className="flex items-center justify-center flex-1">
                    <Icon className={`w-10 h-10 ${link.iconClassName}`} />
                  </div>
                  <div className="mt-3">
                    <H3 className="text-center">{link.title}</H3>
                    <P className="text-xs text-muted-foreground text-center mt-0.5">
                      {link.description}
                    </P>
                  </div>
                </Link>
              );
            })}
          </div>
        }
      </div>
    </div>
  );
};
