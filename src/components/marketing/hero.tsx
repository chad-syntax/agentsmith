import { BrevoEmailSubscribe } from '@/components/brevo-email-subscribe/brevo-email-subscribe';

export const HeroSection = () => {
  return (
    <section className="py-10 md:py-16 bg-background bg-grid-pattern bg-[length:30px_30px] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50"></div>
      <div className="container px-4 md:px-6 relative mx-auto">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                Alpha Access Available
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-foreground">
                Develop AI Agents with peace of f*cking mind
              </h1>
              <div id="join-waitlist" />
              <p className="max-w-[600px] text-muted-foreground md:text-xl pt-2">
                Build, test, and deploy AI agents with exceptional prompt authoring capabilities for
                both technical and non-technical users.
              </p>
            </div>
            {/* Replace form with BrevoEmailSubscribe */}
            <BrevoEmailSubscribe form="agentsmithInitialLanding" />
            <p className="text-sm text-primary font-medium">
              🎉 Get 50% off your first year after launch. Join the Alpha Club!
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full h-full min-h-[300px] md:min-h-[400px] rounded-lg overflow-hidden border border-border bg-card p-2">
              <div className="bg-background rounded-md h-full w-full flex items-center justify-center">
                {/* Placeholder image */}
                <img
                  src="https://place-hold.it/600x400?text=Agentsmith+App+Screenshot"
                  alt="Agentsmith App Placeholder"
                  className="object-cover w-full h-full rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
