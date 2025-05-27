import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Pencil, FlaskConical, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface HowItWorksStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: HowItWorksStep[] = [
  {
    icon: Pencil,
    title: 'Author Your Prompts',
    description:
      'Design and author your AI prompts using our intuitive interface, with support for variables and versioning.',
  },
  {
    icon: FlaskConical,
    title: 'Test & Refine',
    description:
      'Test your prompts with different models and inputs, refining them for optimal performance and reliability.',
  },
  {
    icon: Rocket,
    title: 'Sync & Deploy',
    description:
      'Sync your prompts to your repository, and deploy your AI agents. Easily scale as your needs grow.',
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-background scroll-mt-40">
      <div className="container px-4 md:px-6 relative mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-foreground">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started with Agentsmith in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
          {steps.map((step) => (
            <Card
              key={step.title}
              className="bg-card border-border rounded-lg overflow-hidden flex flex-col items-center text-center"
            >
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4 mx-auto">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">{step.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
