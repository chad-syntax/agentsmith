import { BrevoEmailSubscribe } from '@/components/brevo-email-subscribe/brevo-email-subscribe';
import { H1, P } from '@/components/typography';
import { routes } from '@/utils/routes';
import Link from 'next/link';

export const WaitlistedPage = () => {
  return (
    <div className="container mx-auto mt-8 px-4 sm:mt-12 md:mt-16 flex flex-col items-center text-center max-w-2xl gap-6 md:gap-8">
      <H1>You're on the Waitlist!</H1>
      <P>
        Thank you for your interest in Agentsmith. You've been added to our waitlist. Subscribe to
        our newsletter to be notified when you can get access:
      </P>
      <div className="w-full max-w-md">
        <BrevoEmailSubscribe trackingLocation="waitlisted-page" form="agentsmithInitialLanding" />
      </div>
      <P>
        If you believe you should already have access, please email us at{' '}
        <a href={routes.emails.support} className="underline hover:text-primary">
          {routes.emails.support.replace('mailto:', '')}
        </a>
        .
      </P>
      <P>
        If you don't have access but really, really want it, reach out to{' '}
        <a href={routes.emails.team} className="underline hover:text-primary">
          {routes.emails.team.replace('mailto:', '')}
        </a>
        .
      </P>
    </div>
  );
};
