'use client';

import { useState, useCallback, useMemo } from 'react';
import { H1 } from '@/components/typography';
import { GetProjectDataResult } from '@/lib/ProjectsService';
import { GetAvailableFiltersResult } from '@/lib/MetricsService';
import {
  LogsFilters,
  LogsFilters as LogsFiltersType,
} from '@/page-components/LogsPage/logs-filters';
import {
  renderLogItem,
  renderNoResults,
  renderSkeleton,
} from '@/page-components/LogsPage/log-item';
import { InfiniteList } from '@/components/infinite-list';
import { createLogsQueryHandler } from '@/lib/logs-query-handler';
import { downloadCSVData } from '@/utils/download-csv-data';
import { LogData } from './log-type';

type LogsPageProps = {
  project: NonNullable<GetProjectDataResult>;
  availableFilters: GetAvailableFiltersResult;
};

export const LogsPage = (props: LogsPageProps) => {
  const { project, availableFilters } = props;

  const [filters, setFilters] = useState<LogsFiltersType>({
    status: 'all',
    source: 'all',
    prompt: 'all',
    model: 'all',
    provider: 'all',
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date(),
    },
  });

  const [logsData, setLogsData] = useState<LogData[]>([]);

  const handleFiltersChange = useCallback((newFilters: LogsFiltersType) => {
    setFilters(newFilters);
  }, []);

  // Memoize the query handler so it gets recreated when filters change
  const queryHandler = useMemo(() => {
    return createLogsQueryHandler(filters, project.id);
  }, [filters]);

  const handleDownloadCSVClick = () => {
    const startDate = filters.dateRange.from.toISOString().split('T')[0];
    const endDate = filters.dateRange.to.toISOString().split('T')[0];
    const filename = `logs_${startDate}_to_${endDate}.csv`;
    const csvData = logsData.map((log) => {
      const { id, prompt_versions, ...rest } = log;
      return {
        ...rest,
        prompt_version_id: prompt_versions?.uuid,
        project_id: project.uuid,
        prompt: prompt_versions?.prompts?.name,
        prompt_version: prompt_versions?.version,
      };
    });
    downloadCSVData(csvData, filename);
  };

  return (
    <div className="p-6">
      <H1 className="mb-4">Logs</H1>

      <LogsFilters
        availableFilters={availableFilters}
        onFiltersChange={handleFiltersChange}
        onDownloadCSVClick={handleDownloadCSVClick}
      />

      <div className="bg-background rounded-lg shadow-sm border overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-border bg-muted/50">
          <div className="grid grid-cols-8 gap-4 px-6 py-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Date
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Source
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Prompt Name
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Prompt Version
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Model
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Provider
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Duration
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <InfiniteList
          tableName="llm_logs"
          columns="id, uuid, project_id, prompt_version_id, start_time, end_time, created_at, updated_at, source, prompt_tokens, completion_tokens, total_tokens, reasoning_tokens, cached_tokens, duration_ms, cost_usd, model, provider, tps, prompt_versions(*, prompts(*))"
          pageSize={20}
          trailingQuery={queryHandler}
          renderItem={renderLogItem(project)}
          renderNoResults={renderNoResults}
          renderSkeleton={renderSkeleton}
          className="max-h-[calc(100vh-320px)]"
          onDataUpdated={(data) => setLogsData(data as LogData[])}
        />
      </div>
    </div>
  );
};

export const LogsPageSkeleton = () => (
  <div className="p-6">
    <H1 className="mb-4">Logs</H1>

    {/* Filter skeleton */}
    <div className="mb-6 p-4 bg-background rounded-lg border">
      <div className="flex flex-wrap gap-4 items-center">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col">
            <div className="h-4 w-16 bg-muted rounded mb-1 animate-pulse">&nbsp;</div>
            <div className="h-9 w-32 bg-muted rounded animate-pulse">&nbsp;</div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-background rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-muted/50">
        <div className="grid grid-cols-8 gap-4 px-6 py-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Date
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Status
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Source
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Prompt Name
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Prompt Version
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Model
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Provider
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Duration
          </div>
        </div>
      </div>

      {/* Skeleton rows */}
      <div className="flex flex-col">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b border-border last:border-b-0">
            <div className="grid grid-cols-8 gap-4 px-6 py-4">
              <div className="bg-muted rounded w-32 h-4 animate-pulse">&nbsp;</div>
              <div className="bg-muted rounded w-20 h-5 animate-pulse">&nbsp;</div>
              <div className="bg-muted rounded w-16 h-4 animate-pulse">&nbsp;</div>
              <div className="bg-muted rounded w-40 h-4 animate-pulse">&nbsp;</div>
              <div className="bg-muted rounded w-16 h-4 animate-pulse">&nbsp;</div>
              <div className="bg-muted rounded w-24 h-4 animate-pulse">&nbsp;</div>
              <div className="bg-muted rounded w-20 h-4 animate-pulse">&nbsp;</div>
              <div className="bg-muted rounded w-12 h-4 animate-pulse">&nbsp;</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
