import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export const useIsLoggedIn = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchIsLoggedIn = async () => {
      const { data, error } = await createClient().auth.getSession();
      if (error) {
        console.error(error);
      }

      setIsLoggedIn(data.session !== null);
      setIsLoading(false);
    };

    fetchIsLoggedIn();
  }, []);

  return { isLoggedIn, isLoading };
};
