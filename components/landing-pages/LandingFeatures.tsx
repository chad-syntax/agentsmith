import {
  IconAppWindow,
  IconSdk,
  IconPlugConnected,
  IconBrandGithub,
} from '@tabler/icons-react';

type LandingFeaturesProps = {
  withOpenSource?: boolean;
};

export const LandingFeatures = (props: LandingFeaturesProps) => {
  const { withOpenSource = false } = props;

  return (
    <div className="grid grid-cols-4 gap-8 mt-24">
      <div className="border border-gray-200 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center mb-2">
          <IconAppWindow size={128} strokeWidth={1.2} />
        </div>
        <p className="text-gray-600">
          Web Studio UI for collaboration, configuration, and sharing
        </p>
      </div>

      <div className="border border-gray-200 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center mb-2">
          <IconSdk size={128} strokeWidth={1.2} />
        </div>
        <p className="text-gray-600">
          Unified API, generated types, expert docs, helpful error hints.
        </p>
      </div>

      <div className="border border-gray-200 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center mb-2">
          <IconPlugConnected size={128} strokeWidth={1.2} />
        </div>
        <p className="text-gray-600">
          Connect your OpenRouter account to pick any LLM and pay as you go
        </p>
      </div>

      <div className="border border-gray-200 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center mb-2">
          <IconBrandGithub size={128} strokeWidth={1.2} />
        </div>
        <p className="text-gray-600">
          {withOpenSource ? 'Open Source, ' : ''}GitHub integration, rollbacks,
          ab testing, and logging.
        </p>
      </div>
    </div>
  );
};
