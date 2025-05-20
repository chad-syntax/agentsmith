import { Database } from '@/app/__generated__/supabase.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AgentsmithService,
  AgentsmithServiceConstructorOptions,
} from './AgentsmithService';

export type AgentsmithSupabaseServiceConstructorOptions = {
  supabase: SupabaseClient<Database>;
};

export class AgentsmithSupabaseService extends AgentsmithService {
  protected supabase: SupabaseClient<Database>;

  constructor(
    options: AgentsmithSupabaseServiceConstructorOptions &
      AgentsmithServiceConstructorOptions
  ) {
    super(options);
    const { supabase } = options;
    this.supabase = supabase;
  }
}
