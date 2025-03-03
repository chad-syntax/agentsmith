import { createClient } from '@/lib/supabase/server';
import { routes } from '@/utils/routes';
import Link from 'next/link';

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
      <h1 className="text-2xl font-bold mb-4">Welp, something's fucked</h1>

      <p className="mb-6">
        Apologies for the inconvenience, we will work to unfuck it as soon as
        possible.
      </p>

      <Link
        href={user ? routes.studio.home : routes.marketing.home}
        className="text-blue-500 hover:underline mb-8"
      >
        {user ? 'Return to Studio' : 'Return to Home'}
      </Link>

      <div className="p-4 bg-gray-100 rounded-md max-w-lg w-full text-xs">
        <p className="font-medium mb-2">Error details:</p>
        <p className="text-red-600">{errorMessage}</p>
      </div>
    </div>
  );
}
