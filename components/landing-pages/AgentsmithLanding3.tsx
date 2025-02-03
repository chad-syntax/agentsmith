'use client';

import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { BrevoEmailSubscribe } from '../BrevoEmailSubscribe/BrevoEmailSubscribe';
import { NotPubliclyAvailable } from './NotPubliclyAvailable';

export const AgentsmithLanding3 = () => {
  return (
    <div className="max-w-[1400px] w-full mx-auto p-16">
      <LandingHero withOpenSource />
      <LandingFeatures withOpenSource />
      <NotPubliclyAvailable />
      <BrevoEmailSubscribe form="agentsmithInitialLanding" />
    </div>
  );
};
