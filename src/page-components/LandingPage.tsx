import { BenefitsSection } from '@/components/marketing/benefits';
import { HowItWorksSection } from '@/components/marketing/how-it-works';
import { HeroSection } from '@/components/marketing/hero';
import { FAQSection } from '@/components/marketing/faq';
import { WaitlistSubscribeSection } from '@/components/marketing/waitlist-subscribe';
import { PricingSection } from '@/components/marketing/pricing';

export const LandingPage = () => {
  return (
    <>
      <HeroSection />
      <BenefitsSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <WaitlistSubscribeSection />
      <div />
    </>
  );
};
