import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { RoadmapItemPage } from '@/page-components/RoadmapItemPage';
import { AuthProvider } from '@/providers/auth';
import { notFound } from 'next/navigation';

type RoadmapItemProps = {
  params: Promise<{ itemSlug: string }>;
};

export default async function RoadmapItem(props: RoadmapItemProps) {
  const { itemSlug } = await props.params;

  const supabase = await createClient();
  const { services } = new AgentsmithServices({ supabase });

  const roadmapItem = await services.roadmap.getRoadmapItemBySlug(itemSlug);

  if (!roadmapItem) {
    return notFound();
  }

  return (
    <AuthProvider>
      <RoadmapItemPage roadmapItem={roadmapItem} />
    </AuthProvider>
  );
}
