import Link from 'next/link';
import { Container } from '@/components/layout/container';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Agentsmith</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#benefits" className="text-foreground/70 hover:text-foreground">
                  Product
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-foreground/70 hover:text-foreground">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-foreground/70 hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#faq" className="text-foreground/70 hover:text-foreground">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/chad-syntax/agentsmith"
                  className="text-foreground/70 hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy-policy" className="text-foreground/70 hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-foreground/70 hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>
      <div className="py-8 border-t border-border flex justify-center items-center">
        <p className="text-xs text-foreground/70">© {new Date().getFullYear()} Chad Syntax LLC</p>
      </div>
    </footer>
  );
};
