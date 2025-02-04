'use client';

import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { BrevoEmailSubscribe } from '../BrevoEmailSubscribe/BrevoEmailSubscribe';
import { NotPubliclyAvailable } from './NotPubliclyAvailable';
import { LandingWrapper } from '../LandingWrapper';

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
