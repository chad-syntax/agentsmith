'use client';

import { createClient } from '&/supabase/client';
import { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Database } from '../__generated__/supabase.types';
import { GetUserOrganizationDataResult } from '&/onboarding';

export type AgentsmithUser =
  Database['public']['Tables']['agentsmith_users']['Row'];

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  agentsmithUser: AgentsmithUser | null;
  organizationData: GetUserOrganizationDataResult | null;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  agentsmithUser: null,
  organizationData: null,
});

export const useAuth = () => {
  const authCtx = useContext(AuthContext);
  return authCtx;
};

type AuthProviderProps = {
  children: React.ReactNode;
  user?: User;
  agentsmithUser?: AgentsmithUser;
  organizationData?: GetUserOrganizationDataResult;
};

export const AuthProvider = (props: AuthProviderProps) => {
  const {
    children,
    user: initialUser,
    agentsmithUser: initialAgentsmithUser,
  } = props;

  const supabase = createClient();
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(!Boolean(initialUser));
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialUser));
  const [agentsmithUser, setAgentsmithUser] = useState<AgentsmithUser | null>(
    initialAgentsmithUser ?? null
  );
  const [organizationData, setOrganizationData] =
    useState<GetUserOrganizationDataResult | null>(
      props.organizationData ?? null
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

        const { data: organizationData, error: organizationDataError } =
          await supabase
            .from('agentsmith_users')
            .select(
              `
            organization_users (
              id, 
              organizations (
                uuid, 
                name, 
                organization_keys (
                  id,
                  key
                ),
                projects (
                  uuid,
                  name
                )
              )
            )`
            )
            .eq('auth_user_id', userFromSupabase.id)
            .single();

        if (organizationDataError) {
          console.error(organizationDataError);
        }

        setOrganizationData(organizationData);
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
      organizationData,
    }),
    [user, isLoading, isAuthenticated, agentsmithUser, organizationData]
  );

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
};

export const signInWithGithub = async () => {
  const supabase = createClient();

  await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `http://localhost:3000/auth/callback` },
  });
};
