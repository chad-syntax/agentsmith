import { RoadmapPage } from '@/page-components/RoadmapPage';
import { createClient } from '@/lib/supabase/server';
import { GetRoadmapItemsResult } from '@/lib/RoadmapService';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { AuthProvider } from '@/providers/auth';

export const revalidate = 43200;

export default async function RoadmapServerPage() {
  const supabase = await createClient();
  const { services, logger } = new AgentsmithServices({ supabase });

  let initialRoadmapItems: GetRoadmapItemsResult = [];
  try {
    initialRoadmapItems = await services.roadmap.getRoadmapItems();
  } catch (error) {
    logger.error('Failed to fetch roadmap items for page:', error);
  }

  return (
    <AuthProvider>
      <RoadmapPage initialRoadmapItems={initialRoadmapItems} />
    </AuthProvider>
  );
}
