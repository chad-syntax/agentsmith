import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { GetAvailableFiltersResult } from '@/lib/MetricsService';
import { Database } from '@/app/__generated__/supabase.types';
import { Download, X } from 'lucide-react';

export type LogsFilters = {
  status: 'all' | 'completed' | 'running';
  source: Database['public']['Enums']['llm_log_source'] | 'all';
  prompt: number | 'all';
  model: string | 'all';
  provider: string | 'all';
  dateRange: {
    from: Date;
    to: Date;
  };
};

type LogsFiltersProps = {
  availableFilters: GetAvailableFiltersResult;
  onFiltersChange: (filters: LogsFilters) => void;
  onDownloadCSVClick: () => void;
};

export const LogsFilters = (props: LogsFiltersProps) => {
  const { availableFilters, onFiltersChange, onDownloadCSVClick } = props;

  const [filters, setFilters] = useState<LogsFilters>({
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

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = <K extends keyof LogsFilters>(key: K, value: LogsFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
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
  };

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.source !== 'all' ||
    filters.prompt !== 'all' ||
    filters.model !== 'all' ||
    filters.provider !== 'all';

  return (
    <div className="mb-6 p-4 bg-background rounded-lg border">
      <div className="flex justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Status Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter('status', value as LogsFilters['status'])}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Source</label>
            <Select
              value={filters.source}
              onValueChange={(value) => updateFilter('source', value as LogsFilters['source'])}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {availableFilters.sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Prompt</label>
            <Select
              value={filters.prompt.toString()}
              onValueChange={(value) =>
                updateFilter('prompt', value === 'all' ? 'all' : parseInt(value))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {availableFilters.prompts.map((prompt) => (
                  <SelectItem key={prompt.id} value={prompt.id.toString()}>
                    {prompt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Model</label>
            <Select value={filters.model} onValueChange={(value) => updateFilter('model', value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {availableFilters.models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Provider Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Provider</label>
            <Select
              value={filters.provider}
              onValueChange={(value) => updateFilter('provider', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {availableFilters.providers.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Date Range</label>
            <DateRangePicker
              initialDateFrom={filters.dateRange.from}
              initialDateTo={filters.dateRange.to}
              onUpdate={(values) => {
                if (values.range.from && values.range.to) {
                  updateFilter('dateRange', {
                    from: values.range.from,
                    to: values.range.to,
                  });
                }
              }}
              showCompare={false}
              align="start"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-transparent">Clear</label>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onDownloadCSVClick}>
          <Download className="h-4 w-4" />
          Download CSV
        </Button>
      </div>
    </div>
  );
};
