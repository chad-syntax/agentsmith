'use client';

import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { BrevoEmailSubscribe } from '../brevo-email-subscribe/brevo-email-subscribe';
import { NotPubliclyAvailable } from './NotPubliclyAvailable';
import { LandingWrapper } from '../landing-wrapper';

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
