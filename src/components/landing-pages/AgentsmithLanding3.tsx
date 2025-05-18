'use client';

import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { BrevoEmailSubscribe } from '../brevo-email-subscribe/brevo-email-subscribe';
import { NotPubliclyAvailable } from './NotPubliclyAvailable';
import { LandingWrapper } from '../landing-wrapper';

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
