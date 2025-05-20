'use client';

import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { BrevoEmailSubscribe } from '../brevo-email-subscribe/brevo-email-subscribe';
import { NotPubliclyAvailable } from './NotPubliclyAvailable';
import { LandingWrapper } from '../landing-wrapper';

export const AgentsmithLanding1 = () => {
  return (
    <LandingWrapper>
      <LandingHero />
      <LandingFeatures />
      <NotPubliclyAvailable />
      <BrevoEmailSubscribe form="agentsmithInitialLanding" />
    </LandingWrapper>
  );
};
