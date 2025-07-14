import { Database } from '@/app/__generated__/supabase.types';

// Define the log data type based on the joined query
export type LogData = Database['public']['Tables']['llm_logs']['Row'] & {
  prompt_versions: {
    uuid: string;
    version: string;
    prompts: {
      uuid: string;
      name: string;
    } | null;
  } | null;
};
