'use client';

import { createClient } from '~/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Database } from '../__generated__/supabase.types';

export type AgentsmithUser =
  Database['public']['Tables']['agentsmith_users']['Row'];

export type AuthContextType = {
  user: User | null;
  agentsmithUser: AgentsmithUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
};

export const AuthProvider = (props: AuthProviderProps) => {
  const { children } = props;

  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [agentsmithUser, setAgentsmithUser] = useState<AgentsmithUser | null>(
    null
  );

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setIsAuthenticated(Boolean(user));

      if (user) {
        const { data: agentsmithUser } = await supabase
          .from('agentsmith_users')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        setAgentsmithUser(agentsmithUser);
      }

      setIsLoading(false);
    };
    getUser();
  }, []);

  const authState = useMemo(
    () => ({ user, isLoading, isAuthenticated, agentsmithUser }),
    [user, isLoading, isAuthenticated, agentsmithUser]
  );

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
};
