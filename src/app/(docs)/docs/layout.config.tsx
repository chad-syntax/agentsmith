import { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { HomeIcon, PencilRuler, Map } from 'lucide-react';
import { GithubInfo } from 'fumadocs-ui/components/github-info';

export const options: BaseLayoutProps = {
  links: [
    {
      type: 'custom',
      children: <GithubInfo owner="chad-syntax" repo="agentsmith" className="mb-4" />,
    },
    {
      icon: <HomeIcon />,
      text: 'Home Page',
      url: '/',
    },
    {
      icon: <PencilRuler />,
      text: 'Studio',
      url: '/studio',
    },
    {
      icon: <Map />,
      text: 'Roadmap',
      url: '/roadmap',
    },
  ],
  nav: {
    title: 'Docs',
    url: '/docs',
  },
};
