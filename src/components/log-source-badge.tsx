import { Badge } from '@/components/ui/badge';
import { Database } from '@/app/__generated__/supabase.types';

type LogSourceBadgeProps = {
  source: Database['public']['Enums']['llm_log_source'];
};

const LOG_SOURCE_LABELS: Record<Database['public']['Enums']['llm_log_source'], string> = {
  STUDIO: 'Studio',
  SDK: 'SDK',
  AGENTSMITH_EVAL: 'Eval',
  AGENTSMITH_AI_AUTHOR: 'AI Author',
};

export const LogSourceBadge = (props: LogSourceBadgeProps) => {
  return <Badge variant={props.source}>{LOG_SOURCE_LABELS[props.source]}</Badge>;
};
