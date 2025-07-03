import { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { HomeIcon, PencilRuler, Map } from 'lucide-react';

export const baseOptions: BaseLayoutProps = {
  links: [
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
