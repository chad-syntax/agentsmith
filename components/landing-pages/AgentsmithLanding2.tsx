'use client';

import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { BrevoEmailSubscribe } from '../BrevoEmailSubscribe/BrevoEmailSubscribe';
import { NotPubliclyAvailable } from './NotPubliclyAvailable';

export const AgentsmithLanding2 = () => {
  return (
    <div className="max-w-[1400px] w-full mx-auto p-16">
      <LandingHero withAlphaClub={false} />
      <LandingFeatures />
      <NotPubliclyAvailable withAlphaClub={false} />
      <BrevoEmailSubscribe form="agentsmithInitialLanding" />
    </div>
  );
};
