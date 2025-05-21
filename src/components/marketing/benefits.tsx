import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Code, GitBranch, Shuffle, CheckCircle2, LucideIcon, Code2 } from 'lucide-react';
import { GithubIcon } from '../icons/github';

interface BenefitCardProps {
  icon: any;
  title: string;
  description: string;
}

const benefitsData: BenefitCardProps[] = [
  {
    icon: CheckCircle2,
    title: 'Exceptional Prompt Authoring',
    description:
      'Intuitive prompt engineering tools for both technical and non-technical users, making AI development accessible to everyone.',
  },
  {
    icon: GitBranch,
    title: 'Seamless Synchronization',
    description:
      'Synchronize prompt versions, variables, and content to your repository through Pull Requests for version control and collaboration.',
  },
  {
    icon: Code,
    title: 'Typesafe SDK',
    description:
      'Our typesafe SDK is designed to prevent erroneous prompt modifications, ensuring reliability in your AI applications.',
  },
  {
    icon: Shuffle,
    title: 'Provider Switching',
    description:
      'Effortlessly switch between providers and models using OpenRouter, giving you flexibility and cost control.',
  },
  {
    icon: GithubIcon,
    title: 'Open Source',
    description:
      'Benefit from our open-source approach, allowing for community contributions and transparency in development.',
  },
  {
    icon: Code2, // Using Code2 icon from lucide-react for better distinction
    title: 'TypeScript & Python Support',
    description:
      'Use our fully-typed SDKs for TypeScript and Python to integrate AI agents into your applications with confidence and type safety.',
  },
];

export const BenefitsSection = () => {
  return (
    <section id="benefits" className="text-foreground">
      <div className="pb-10 container px-4 md:px-6 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-foreground">
            Key Benefits
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
                <CardHeader className="pb-4">
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
