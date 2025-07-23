import { HowItWorksSection } from '@/components/marketing/how-it-works';
import { HeroSection } from '@/components/marketing/hero';
import { FAQSection } from '@/components/marketing/faq';
import { PricingSection } from '@/components/marketing/pricing';
import { RoadmapSection } from '@/components/marketing/roadmap';
import { LandingStructuredJSON } from '@/components/landing-structured-json';
import { GetRoadmapItemsResult } from '@/lib/RoadmapService';

type LandingPageProps = {
  roadmapItems: GetRoadmapItemsResult;
};

export const LandingPage = (props: LandingPageProps) => {
  const { roadmapItems } = props;

  return (
    <>
      <LandingStructuredJSON />
      <HeroSection />
      <HowItWorksSection />
      <PricingSection />
      {roadmapItems.length > 0 && <RoadmapSection roadmapItems={roadmapItems} />}
      <FAQSection />
      <div />
    </>
  );
};
