import { redirect } from 'next/navigation';
import { EventDetailPage } from '@/page-components/EventDetailPage'; // Corrected import path
import { routes } from '@/utils/routes';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';

type EventDetailPageRouteProps = {
  params: Promise<{
    projectUuid: string;
    eventUuid: string;
  }>;
};

export default async function EventDetail(props: EventDetailPageRouteProps) {
  const { projectUuid, eventUuid } = await props.params;

  const supabase = await createClient();
  const agentsmith = new AgentsmithServices({ supabase });

  const event = await agentsmith.services.events.getEventByUuid(eventUuid);

  if (!event) {
    redirect(routes.studio.events(projectUuid));
  }

  return <EventDetailPage event={event} />;
}
