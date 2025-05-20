'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { routes } from '@/utils/routes';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export const SignOutButton = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(routes.auth.signIn);
  };

  return (
    <Button variant="destructive" onClick={logout} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : 'Sign Out'}
    </Button>
  );
};
