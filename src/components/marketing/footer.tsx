import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { routes } from '@/utils/routes';

type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const footerData: FooterColumn[] = [
  {
    title: 'Agentsmith',
    links: [
      { href: '/#benefits', label: 'Product' },
      { href: routes.marketing.roadmap(), label: 'Roadmap' },
      { href: routes.docs.home, label: 'Docs' },
      { href: '/#how-it-works', label: 'How It Works' },
      { href: '/#pricing', label: 'Pricing' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: routes.external.github, label: 'GitHub', external: true },
      {
        href: routes.external.npm,
        label: 'NPM',
        external: true,
      },
      {
        href: routes.emails.support,
        label: 'Support',
      },
      {
        href: routes.external.discord,
        label: 'Discord',
        external: true,
      },
      {
        href: '/llms.txt',
        label: 'llms.txt',
      },
      {
        href: '/sitemap.xml',
        label: 'Sitemap',
      },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: routes.marketing.privacy, label: 'Privacy Policy' },
      { href: routes.marketing.terms, label: 'Terms of Service' },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {footerData.map((column) => (
            <div key={column.title} className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">{column.title}</h4>
              <ul className="space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="text-foreground/70 hover:text-foreground"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-foreground/70 hover:text-foreground">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
      <div className="py-8 border-t border-border flex justify-center items-center">
        <p className="text-xs text-foreground/70">© {new Date().getFullYear()} Chad Syntax LLC</p>
      </div>
    </footer>
  );
};
