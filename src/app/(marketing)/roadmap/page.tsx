import { RoadmapPage } from '@/page-components/RoadmapPage';
import { createClient } from '@/lib/supabase/client';
import { GetRoadmapItemsResult } from '@/lib/RoadmapService';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { AuthProvider } from '@/providers/auth';
import { Suspense } from 'react';

export const metadata = {
  title: 'Roadmap',
  description: 'The Agentsmith Roadmap. See what we are working on and what is coming soon.',
  alternates: {
    canonical: '/roadmap',
  },
};

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
        <RoadmapPage initialRoadmapItems={initialRoadmapItems} />
      </AuthProvider>
    </Suspense>
  );
}
