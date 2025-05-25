import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { GetRoadmapItemsResult } from '@/lib/RoadmapService';
import { createClient } from '@/lib/supabase/server';
import { LandingPage } from '@/page-components/LandingPage';

export const revalidate = 604800;

export default async function Landing() {
  const supabase = await createClient();

  const { services, logger } = new AgentsmithServices({ supabase });

  let initialRoadmapItems: GetRoadmapItemsResult = [];
  try {
    initialRoadmapItems = await services.roadmap.getRoadmapItems({
      orderBy: [{ column: 'avg_score', ascending: false }],
      limit: 3,
    });
  } catch (error) {
    logger.error('Failed to fetch roadmap items for page:', error);
  }

  return <LandingPage roadmapItems={initialRoadmapItems} />;
}
