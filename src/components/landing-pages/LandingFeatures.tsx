import { AppWindow, Code2, Plug, Github } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/shadcn';

type LandingFeaturesProps = {
  withOpenSource?: boolean;
};

export const LandingFeatures = (props: LandingFeaturesProps) => {
  const { withOpenSource = false } = props;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-24">
      <Card className="border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <AppWindow size={128} strokeWidth={1.2} className="text-primary" />
          </div>
          <p className="text-muted-foreground">
            Web Studio UI for collaboration, configuration, and sharing
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <Code2 size={128} strokeWidth={1.2} className="text-primary" />
          </div>
          <p className="text-muted-foreground">
            Unified API, generated types, expert docs, helpful error hints.
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <Plug size={128} strokeWidth={1.2} className="text-primary" />
          </div>
          <p className="text-muted-foreground">
            Connect your OpenRouter account to pick any LLM and pay as you go
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <Github size={128} strokeWidth={1.2} className="text-primary" />
          </div>
          <p className="text-muted-foreground">
            {withOpenSource ? 'Open Source, ' : ''}GitHub integration, rollbacks, ab testing, and
            logging.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
