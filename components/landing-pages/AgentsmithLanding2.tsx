'use client';

import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { BrevoEmailSubscribe } from '../BrevoEmailSubscribe/BrevoEmailSubscribe';
import { NotPubliclyAvailable } from './NotPubliclyAvailable';
import { LandingWrapper } from '../LandingWrapper';

export const AgentsmithLanding2 = () => {
  return (
    <LandingWrapper>
      <LandingHero withAlphaClub={false} />
      <LandingFeatures />
      <NotPubliclyAvailable withAlphaClub={false} />
      <BrevoEmailSubscribe form="agentsmithInitialLanding" />
    </LandingWrapper>
  );
};
