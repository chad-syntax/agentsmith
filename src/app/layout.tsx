import './globals.css';
import { IBM_Plex_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Toaster } from '@/components/ui/sonner';
import { PostHogProvider } from '@/providers/posthog';

const defaultUrl =
  process.env.VERCEL_ENV === 'production' && process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Agentsmith - AI Agent Development Platform',
  description: 'Agentsmith is the fastest way to build and iterate on LLM-powered apps',
};

const ibmPlexMono = IBM_Plex_Mono({
  display: 'swap',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout(props: RootLayoutProps) {
  const { children } = props;

  return (
    <html lang="en" className={ibmPlexMono.className} suppressHydrationWarning>
      {process.env.VERCEL_ENV !== 'production' && (
        <head>
          <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
        </head>
      )}
      <PostHogProvider>
        <GoogleAnalytics gaId="G-PZG86YG9ZZ" />
        <body className="bg-background text-foreground">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster expand visibleToasts={9} />
          </ThemeProvider>
        </body>
      </PostHogProvider>
    </html>
  );
}
