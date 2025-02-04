'use client';

import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { BrevoEmailSubscribe } from '../BrevoEmailSubscribe/BrevoEmailSubscribe';
import { NotPubliclyAvailable } from './NotPubliclyAvailable';
import { LandingWrapper } from '../LandingWrapper';

export const AgentsmithLanding3 = () => {
  return (
    <LandingWrapper>
      <LandingHero withOpenSource />
      <LandingFeatures withOpenSource />
      <NotPubliclyAvailable />
      <BrevoEmailSubscribe form="agentsmithInitialLanding" />
    </LandingWrapper>
  );
};
