import { SupabaseQueryHandler } from '@/hooks/use-infinite-query';
import { LogsFilters } from '@/page-components/LogsPage/logs-filters';

export const createLogsQueryHandler = (
  filters: LogsFilters,
  projectId: number,
): SupabaseQueryHandler<'llm_logs'> => {
  return (query) => {
    // Apply filters first
    let filteredQuery = query.eq('project_id', projectId);

    // Apply status filter
    if (filters.status === 'completed') {
      filteredQuery = filteredQuery.not('end_time', 'is', null);
    } else if (filters.status === 'running') {
      filteredQuery = filteredQuery.is('end_time', null);
    }

    // Apply source filter
    if (filters.source !== 'all') {
      filteredQuery = filteredQuery.eq('source', filters.source);
    }

    // Apply model filter
    if (filters.model !== 'all') {
      filteredQuery = filteredQuery.eq('model', filters.model);
    }

    // Apply provider filter
    if (filters.provider !== 'all') {
      filteredQuery = filteredQuery.eq('provider', filters.provider);
    }

    // Apply prompt filter
    if (filters.prompt !== 'all') {
      filteredQuery = filteredQuery.eq('prompt_versions.prompt_id', filters.prompt);
    }

    // Apply date range filter
    filteredQuery = filteredQuery
      .gte('created_at', filters.dateRange.from.toISOString())
      .lte('created_at', filters.dateRange.to.toISOString());

    // Apply ordering
    filteredQuery = filteredQuery.order('created_at', { ascending: false });

    return filteredQuery;
  };
};
