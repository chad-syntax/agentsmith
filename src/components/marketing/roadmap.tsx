import { GetRoadmapItemsResult } from '@/lib/RoadmapService';
import { RoadmapItemCard } from '../roadmap/item-card';
import { P } from '../typography';
import { routes } from '@/utils/routes';
import Link from 'next/link';

type RoadmapSectionProps = {
  roadmapItems: GetRoadmapItemsResult;
};

export const RoadmapSection = (props: RoadmapSectionProps) => {
  const { roadmapItems } = props;

  return (
    <section id="roadmap" className="bg-background scroll-mt-40">
      <div className="container px-4 md:px-6 relative mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-foreground">
            Roadmap
          </h2>
          <P>See what we're working on, vote for features, and suggest new ideas.</P>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {roadmapItems.map((item) => (
            <RoadmapItemCard key={item.id} item={item} />
          ))}
        </div>
        <div className="text-center">
          <Link href={routes.marketing.roadmap()} className="text-primary hover:underline">
            View the full roadmap &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
};
