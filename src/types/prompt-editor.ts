import { Database } from '@/app/__generated__/supabase.types';

export type EditorPromptVariable = Pick<
  Database['public']['Tables']['prompt_variables']['Row'],
  'name' | 'type' | 'required'
> & { id?: number; default_value?: string | null };

export type IncludedPrompt = {
  slug: string;
  version: string;
  versionUuid: string;
  content: string;
  variables: EditorPromptVariable[];
};
