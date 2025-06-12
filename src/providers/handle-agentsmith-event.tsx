import Link from 'next/link';
import type { GetUserOrganizationDataResult } from '@/lib/UsersService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { Database } from '@/app/__generated__/supabase.types';

import { routes } from '@/utils/routes';

type Organization = GetUserOrganizationDataResult['organization_users'][number]['organizations'];
type Project = Organization['projects'][number];
type AgentsmithEvent = Database['public']['Tables']['agentsmith_events']['Row'];
type Payload = RealtimePostgresInsertPayload<AgentsmithEvent>;

export const handleAgentsmithEvent = (selectedProject: Project) => (payload: Payload) => {
  const { new: record } = payload;

  const href = routes.studio.eventDetail(selectedProject?.uuid ?? '', record.uuid);

  const toastId = toast[record.type === 'SYNC_ERROR' ? 'error' : 'message'](record.name, {
    description: record.description,
    duration: record.type === 'SYNC_ERROR' ? 10000 : undefined,
    action: (
      <Button
        asChild
        size="sm"
        variant="link"
        className="ml-auto"
        onClick={() => {
          toast.dismiss(toastId);
        }}
      >
        <Link href={href}>Details</Link>
      </Button>
    ),
  });
};
