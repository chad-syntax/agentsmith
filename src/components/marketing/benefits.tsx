import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Users, GitBranch, ShieldCheck, Shuffle, Github, LineChart } from 'lucide-react';

interface BenefitCardProps {
  icon: any;
  title: string;
  description: string;
}

const benefitsData: BenefitCardProps[] = [
  {
    icon: Users,
    title: 'Collaborative Prompt Management',
    description:
      'Centralized prompt authoring for technical & non-technical users. Auto-detect variables and ensure version sync for seamless collaboration.',
  },
  {
    icon: GitBranch,
    title: 'Git-Powered Handoff',
    description:
      'Sync authors and engineers with automated Pull Requests for prompt and variable changes, keeping developers updated.',
  },
  {
    icon: ShieldCheck,
    title: 'Hardened Prompt Integration',
    description:
      'Eliminate runtime errors with our typesafe SDK. Compile-time checks and type hints ensure correct prompt usage and variable handling.',
  },
  {
    icon: Shuffle,
    title: 'Unified API for All LLMs',
    description:
      'Access OpenAI, Google, Anthropic & more via one API (powered by OpenRouter). Switch models/providers easily, no writing wrappers for every provider.',
  },
  {
    icon: Github,
    title: 'Transparent & Adaptable',
    description:
      'Agentsmith is a transparent, open-source platform. Avoid vendor lock-in, benefit from community input, and customize freely.',
  },
  {
    icon: LineChart,
    title: 'Clear Observability',
    description:
      'Identify costly prompts and slow models. Track latency and usage to optimize performance and control spend.',
  },
];

export const BenefitsSection = () => {
  return (
    <section id="benefits" className="text-foreground scroll-mt-40">
      <div className="pb-10 container px-4 md:px-6 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-foreground">
            Less Spinning, More Winning
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Agentsmith provides everything you need to build, test, and deploy AI agents with
            confidence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefitsData.map((benefit) => {
            const IconComponent = benefit.icon;
            return (
              <Card
                key={benefit.title}
                className="bg-card border-border rounded-lg overflow-hidden"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconComponent className="min-w-6 h-6 w-6 text-primary" />
                    <h3 className="text-xl font-bold text-card-foreground">{benefit.title}</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
