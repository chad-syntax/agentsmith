import { BrevoEmailSubscribe } from '@/components/brevo-email-subscribe/brevo-email-subscribe';

export function WaitlistSubscribeSection() {
  return (
    <section className="bg-background">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">
            Join the waitlist
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Be among the first to access Agentsmith and get 50% off your first year.
          </p>
          <div className="max-w-md mx-auto">
            <BrevoEmailSubscribe
              trackingLocation="waitlist-subscribe"
              form="agentsmithInitialLanding"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
