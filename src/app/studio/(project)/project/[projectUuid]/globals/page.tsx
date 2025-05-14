import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { ProjectGlobalsPage } from '@/page-components/ProjectGlobalsPage';

type ProjectGlobalsProps = {
  params: Promise<{
    projectUuid: string;
  }>;
};

export default async function ProjectGlobals(props: ProjectGlobalsProps) {
  const { projectUuid } = await props.params;

  const supabase = await createClient();

  const { services } = new AgentsmithServices({ supabase });

  const projectGlobals = await services.projects.getProjectGlobalsByUuid(projectUuid);

  return <ProjectGlobalsPage projectGlobals={projectGlobals} projectUuid={projectUuid} />;
}
