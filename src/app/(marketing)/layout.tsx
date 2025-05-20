import { Header } from '@/components/marketing/header';
import { Footer } from '@/components/marketing/footer';

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout(props: RootLayoutProps) {
  const { children } = props;

  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-20 items-center">
          <div className="flex flex-col gap-20 w-full">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
