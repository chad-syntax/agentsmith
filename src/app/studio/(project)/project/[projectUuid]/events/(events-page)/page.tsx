import { redirect } from 'next/navigation';
import { EventsPage } from '@/page-components/EventsPage'; // Corrected import path
import { routes } from '@/utils/routes';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';

type EventsPageRouteProps = {
  params: Promise<{
    projectUuid: string;
  }>;
};

export default async function Events(props: EventsPageRouteProps) {
  const { projectUuid } = await props.params;

  const supabase = await createClient();
  const { services, logger } = new AgentsmithServices({ supabase });

  const project = await services.projects.getProjectDataByUuid(projectUuid);

  if (!project) {
    logger.warn(`Project not found for UUID: ${projectUuid}. Redirecting.`);

    redirect(routes.studio.home);
  }

  const events = await services.events.getEventsByProjectId(project.id);

  return <EventsPage project={project} events={events} />;
}
