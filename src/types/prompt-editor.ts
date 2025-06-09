import { Database } from '@/app/__generated__/supabase.types';

export type EditorPromptVariable = Pick<
  Database['public']['Tables']['prompt_variables']['Row'],
  'name' | 'type' | 'required' | 'default_value'
> & { id?: number };
