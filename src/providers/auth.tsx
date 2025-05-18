'use client';

import { createClient } from '&/supabase/client';
import { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Database } from '../__generated__/supabase.types';

export type AgentsmithUser = Database['public']['Tables']['agentsmith_users']['Row'];

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  agentsmithUser: AgentsmithUser | null;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  agentsmithUser: null,
});

export const useAuth = () => {
  const authCtx = useContext(AuthContext);
  return authCtx;
};

type AuthProviderProps = {
  children: React.ReactNode;
  user?: User;
  agentsmithUser?: AgentsmithUser;
};

export const AuthProvider = (props: AuthProviderProps) => {
  const { children, user: initialUser, agentsmithUser: initialAgentsmithUser } = props;

  const supabase = createClient();
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(!Boolean(initialUser));
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialUser));
  const [agentsmithUser, setAgentsmithUser] = useState<AgentsmithUser | null>(
    initialAgentsmithUser ?? null,
  );

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: userFromSupabase },
      } = await supabase.auth.getUser();

      setUser(userFromSupabase);
      setIsAuthenticated(Boolean(user));

      if (userFromSupabase) {
        const { data: agentsmithUser } = await supabase
          .from('agentsmith_users')
          .select('*')
          .eq('auth_user_id', userFromSupabase.id)
          .single();
        setAgentsmithUser(agentsmithUser);
      }

      setIsLoading(false);
    };

    if (!user || !agentsmithUser) {
      getUser();
    }
  }, []);

  const authState = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      agentsmithUser,
    }),
    [user, isLoading, isAuthenticated, agentsmithUser],
  );

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
};
