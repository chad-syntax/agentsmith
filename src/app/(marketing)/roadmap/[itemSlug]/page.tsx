import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/client';
import { RoadmapItemPage } from '@/page-components/RoadmapItemPage';
import { AuthProvider } from '@/providers/auth';
import { notFound } from 'next/navigation';

type RoadmapItemProps = {
  params: Promise<{ itemSlug: string }>;
};

export const revalidate = 604800;

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: { itemSlug: string } }) {
  const supabase = createClient();
  const { services } = new AgentsmithServices({ supabase, initialize: false });

  const roadmapItem = await services.roadmap.getRoadmapItemBySlug(params.itemSlug);

  if (!roadmapItem) {
    return {
      title: 'Roadmap Item Not Found',
      description: 'This roadmap item does not exist.',
    };
  }

  return {
    title: roadmapItem.title,
    description: `See roadmap details about ${roadmapItem.title}`,
    alternates: {
      canonical: `/roadmap/${roadmapItem.slug}`,
    },
  };
}

export async function generateStaticParams() {
  const supabase = createClient();
  const { services } = new AgentsmithServices({ supabase, initialize: false });

  const roadmapItems = await services.roadmap.getRoadmapItems();

  return roadmapItems.map((item) => ({
    itemSlug: item.slug,
  }));
}

export default async function RoadmapItem(props: RoadmapItemProps) {
  const { itemSlug } = await props.params;

  const supabase = createClient();
  const { services } = new AgentsmithServices({ supabase, initialize: false });

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
