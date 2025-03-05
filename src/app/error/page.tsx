import { createClient } from '@/lib/supabase/server';
import { routes } from '@/utils/routes';
import Link from 'next/link';
import { H1, P } from '@/components/typography';
import { Button } from '@/components/ui/button';

type ErrorPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function ErrorPage(props: ErrorPageProps) {
  const { searchParams } = props;
  const { message } = await searchParams;
  const errorMessage = message || 'Unknown error occurred';

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <H1 className="mb-4">Welp, something's fucked</H1>

      <P className="mb-6">
        Apologies for the inconvenience, we will work to unfuck it as soon as
        possible.
      </P>

      <Button variant="link" asChild className="mb-8">
        <Link href={user ? routes.studio.home : routes.marketing.home}>
          {user ? 'Return to Studio' : 'Return to Home'}
        </Link>
      </Button>

      <div className="p-4 bg-gray-100 rounded-md max-w-lg w-full text-xs">
        <P className="font-medium mb-2">Error details:</P>
        <P className="text-red-600">{errorMessage}</P>
      </div>
    </div>
  );
}
