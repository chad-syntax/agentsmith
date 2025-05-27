import { RoadmapPage } from '@/page-components/RoadmapPage';
import { createClient } from '@/lib/supabase/client';
import { GetRoadmapItemsResult } from '@/lib/RoadmapService';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { AuthProvider } from '@/providers/auth';
import { Suspense } from 'react';
import { IS_WAITLIST_REDIRECT_ENABLED } from '@/app/constants';

export const revalidate = 43200;

export default async function RoadmapServerPage() {
  // non-ssr client for static rendering
  const supabase = createClient();
  const { services, logger } = new AgentsmithServices({ supabase, initialize: false });

  let initialRoadmapItems: GetRoadmapItemsResult = [];
  try {
    initialRoadmapItems = await services.roadmap.getRoadmapItems();
  } catch (error) {
    logger.error('Failed to fetch roadmap items for page:', error);
  }

  return (
    <Suspense>
      <AuthProvider>
        <RoadmapPage
          initialRoadmapItems={initialRoadmapItems}
          isWaitlistRedirectEnabled={IS_WAITLIST_REDIRECT_ENABLED}
        />
      </AuthProvider>
    </Suspense>
  );
}
