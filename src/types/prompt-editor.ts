import { Database } from '@/app/__generated__/supabase.types';

export type EditorPromptVariable = Pick<
  Database['public']['Tables']['prompt_variables']['Row'],
  'name' | 'type' | 'required'
> & { id?: number; default_value?: string | null };

export type IncludedPrompt = {
  prompt_versions: Pick<
    Database['public']['Tables']['prompt_versions']['Row'],
    'version' | 'uuid' | 'content'
  > & {
    prompts: Pick<Database['public']['Tables']['prompts']['Row'], 'slug'>;
    prompt_variables: EditorPromptVariable[];
  };
};
