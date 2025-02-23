import './globals.css';
import { Roboto_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Footer } from '@/components/Footer';
import { PostHogProvider } from './providers/posthog';

const defaultUrl =
  process.env.VERCEL_ENV === 'production'
    ? 'https://agentsmith.app'
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Agentsmith - AI Agent Development Platform',
  description:
    'Agentsmith is the fastest way to build and iterate on LLM-powered apps',
};

const robotoMono = Roboto_Mono({
  display: 'swap',
  subsets: ['latin'],
});

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout(props: RootLayoutProps) {
  const { children } = props;

  return (
    <html lang="en" className={robotoMono.className} suppressHydrationWarning>
      {/* <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
      </head> */}
      <PostHogProvider>
        <GoogleAnalytics gaId="G-PZG86YG9ZZ" />
        <body className="bg-background text-foreground">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <main className="min-h-screen flex flex-col items-center">
              <div className="flex-1 w-full flex flex-col gap-20 items-center">
                <div className="flex flex-col gap-20 w-full">{children}</div>
                <Footer />
              </div>
            </main>
          </ThemeProvider>
        </body>
      </PostHogProvider>
    </html>
  );
}
