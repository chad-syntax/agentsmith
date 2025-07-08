'use client';

import { useState, useEffect, useRef } from 'react';
import { H1 } from '@/components/typography';
import { GetProjectDataResult } from '@/lib/ProjectsService';
import {
  GetMetricsDataResult,
  GetAvailableFiltersResult,
  MetricsService,
} from '@/lib/MetricsService';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Calendar, Download, FilterIcon, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GetMetricsDataOptions } from '@/lib/MetricsService';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import {
  MetricTab,
  METRIC_TABS,
  GroupByOption,
  METRIC_TAB_ICONS,
  METRIC_TAB_LABELS,
  METRIC_FILTER_DROPDOWNS,
  MetricFilterDropdown,
  METRIC_FILTER_DROPDOWN_PLACEHOLDERS,
  GROUP_BY_OPTIONS,
  METRIC_TAB_TITLES,
  METRIC_FILTER_DROPDOWN_KEYS,
} from './metrics-page-constants';
import { capDayDiff } from '@/utils/cap-day-diff';
import { downloadCSVData } from '@/utils/download-csv-data';
import isEqual from 'lodash.isequal';
import {
  calculateTotals,
  formatTotalValue,
  getCurrentTotal,
  formatXAxisLabel,
  formatTooltipLabel,
  transformGroupedData,
  getChartGroups,
  getDynamicChartConfig,
  formatTooltipContent,
} from './metrics-page-utils';
import { METRIC_DATA_KEYS, METRIC_SUFFIXES } from './metrics-page-constants';

type MetricsPageProps = {
  project: NonNullable<GetProjectDataResult>;
};

export const MetricsPage = (props: MetricsPageProps) => {
  const { project } = props;
  const [activeTab, setActiveTab] = useState<MetricTab>(METRIC_TABS.tokens);
  const [chartData, setChartData] = useState<GetMetricsDataResult>([]);
  const [initialMetricArgs, setInitialMetricArgs] = useState<Omit<
    GetMetricsDataOptions,
    'projectId'
  > | null>(null);
  const [metricArgs, setMetricArgs] = useState<Omit<GetMetricsDataOptions, 'projectId'> | null>(
    null,
  );
  const [availableFilters, setAvailableFilters] = useState<GetAvailableFiltersResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMetricsLoadingRef = useRef(false);
  const isAvailableFiltersLoadingRef = useRef(false);

  const fetchMetricsData = async (args: Omit<GetMetricsDataOptions, 'projectId'>) => {
    if (isMetricsLoadingRef.current) return;
    isMetricsLoadingRef.current = true;
    const supabase = createClient();
    const metricsService = new MetricsService({ supabase });
    const options = {
      projectId: project.id,
      ...args,
    };
    try {
      console.log('fetching metrics data', options);
      const metricsData = await metricsService.getMetricsData(options);
      console.log('metrics data', metricsData);
      setChartData(metricsData);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred, please try again.',
      );
    }
    isMetricsLoadingRef.current = false;
  };

  const fetchAvailableFilters = async (startDate: Date, endDate: Date) => {
    if (isAvailableFiltersLoadingRef.current) return;
    isAvailableFiltersLoadingRef.current = true;
    const supabase = createClient();
    const metricsService = new MetricsService({ supabase });

    const { startDate: cappedStartDate, endDate: cappedEndDate } = capDayDiff(startDate, endDate);

    try {
      const availableFilters = await metricsService.getAvailableFilters(
        project.id,
        cappedStartDate,
        cappedEndDate,
      );

      setAvailableFilters(availableFilters);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred, please try again.',
      );
    }
    isAvailableFiltersLoadingRef.current = false;
  };

  useEffect(() => {
    if (metricArgs) {
      fetchMetricsData(metricArgs);
      fetchAvailableFilters(metricArgs.startDate, metricArgs.endDate);
    }
  }, [metricArgs]);

  useEffect(() => {
    // Default to past 3 days as originally intended
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 3);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const initialMetricArgs = {
      startDate,
      endDate,
      groupBy: undefined,
    };

    setInitialMetricArgs(initialMetricArgs);
    setMetricArgs(initialMetricArgs);
  }, []);

  const resetMetrics = () => {
    setMetricArgs(initialMetricArgs);
  };

  const handleDateRangeUpdate = (value: { range: DateRange }) => {
    setMetricArgs((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        startDate: value.range.from!,
        endDate: value.range.to!,
      };
    });
  };

  const totals = calculateTotals(chartData);
  const transformedChartData = transformGroupedData(chartData, metricArgs);
  const chartGroups = getChartGroups(chartData, metricArgs);

  // Wrapper functions for chart library callbacks
  const xAxisTickFormatter = (timestamp: string) => formatXAxisLabel(timestamp, metricArgs);
  const tooltipLabelFormatter = (timestamp: string) => formatTooltipLabel(timestamp, metricArgs);
  const tooltipContentFormatter = (value: any, name: any) =>
    formatTooltipContent(value, name, metricArgs, activeTab);
  const dynamicChartConfig = getDynamicChartConfig(metricArgs, activeTab, chartGroups);
  const handleDownloadCSVClick = () => {
    const startDate = metricArgs?.startDate.toISOString().split('T')[0];
    const endDate = metricArgs?.endDate.toISOString().split('T')[0];
    const filename = `${project.name}_${activeTab}_metrics_${startDate}_to_${endDate}.csv`;
    downloadCSVData(chartData, filename);
  };

  const resetEnabled = !isEqual(metricArgs, initialMetricArgs);

  if (!metricArgs) {
    return <MetricsPageSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <H1 className="flex items-center gap-2">Metrics</H1>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MetricTab)}>
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-4">
            {Object.entries(METRIC_TABS).map(([key, value]) => (
              <TabsTrigger className="cursor-pointer" key={key} value={value}>
                {METRIC_TAB_ICONS[key as MetricTab]}
                {METRIC_TAB_LABELS[key as MetricTab]}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <DateRangePicker showCompare={false} onUpdate={handleDateRangeUpdate} />
          </div>
        </div>
        {metricArgs && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="mr-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Group by:</span>
                  <Select
                    value={metricArgs.groupBy || 'none'}
                    onValueChange={(value) => {
                      setMetricArgs((prev) => {
                        if (!prev) return null;

                        const groupBy =
                          value === 'none' ? undefined : (value as Exclude<GroupByOption, 'none'>);

                        return { ...prev, groupBy };
                      });
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GROUP_BY_OPTIONS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {Object.entries(METRIC_FILTER_DROPDOWNS).map(([key], index) => {
                const dropdownKey = METRIC_FILTER_DROPDOWN_KEYS[key as MetricFilterDropdown];
                return (
                  <div key={key} className="flex items-center gap-2">
                    {index === 0 && <FilterIcon className="w-4 h-4 text-muted-foreground" />}
                    <Select
                      value={metricArgs[key as MetricFilterDropdown]?.toString() || ''}
                      onValueChange={(value) => {
                        setMetricArgs((prev) => {
                          if (!prev) return null;
                          return { ...prev, [key as MetricFilterDropdown]: value };
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            METRIC_FILTER_DROPDOWN_PLACEHOLDERS[key as MetricFilterDropdown]
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFilters?.[dropdownKey].map((item) => {
                          const id =
                            typeof item === 'object' && 'id' in item
                              ? item.id.toString()
                              : item.toString();
                          const name =
                            typeof item === 'object' && 'name' in item
                              ? item.name
                              : item.toString();
                          return (
                            <SelectItem key={id} value={id}>
                              {name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
            {resetEnabled && (
              <Button variant="ghost" onClick={resetMetrics}>
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>
        )}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{METRIC_TAB_TITLES[activeTab]}</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleDownloadCSVClick}>
              <Download className="w-4 h-4 text-muted-foreground" />
              Download CSV
            </Button>
          </CardHeader>
          <CardContent>
            {transformedChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for the selected filters
              </div>
            ) : (
              <ChartContainer config={dynamicChartConfig} className="h-[300px] w-full">
                <AreaChart data={transformedChartData} width={undefined} height={300}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket_timestamp" tickFormatter={xAxisTickFormatter} />
                  <YAxis />
                  {metricArgs?.groupBy && <Legend />}
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={tooltipContentFormatter}
                        labelFormatter={tooltipLabelFormatter}
                      />
                    }
                  />
                  {!metricArgs?.groupBy ? (
                    <Area
                      type="monotone"
                      dataKey={METRIC_DATA_KEYS[activeTab]}
                      stroke="var(--color-primary)"
                      fill="var(--color-primary)"
                      fillOpacity={0.2}
                    />
                  ) : (
                    chartGroups.map((group) => {
                      const suffix = METRIC_SUFFIXES[activeTab];
                      const dataKey = `${group}${suffix}`;
                      const config = dynamicChartConfig;
                      const color = config[dataKey]?.color || 'var(--color-primary)';

                      return (
                        <Area
                          key={group}
                          type="monotone"
                          dataKey={dataKey}
                          stroke={color}
                          fill={color}
                          fillOpacity={0.2}
                          name={config[dataKey]?.label || group}
                        />
                      );
                    })
                  )}
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Total Amount Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total {METRIC_TAB_LABELS[activeTab]}
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">{METRIC_TAB_ICONS[activeTab]}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTotalValue(getCurrentTotal(totals, activeTab), activeTab)}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeTab === 'duration' ? 'Average' : 'Total'}{' '}
              {METRIC_TAB_TITLES[activeTab].toLowerCase()}
            </p>
            {metricArgs && (
              <p className="text-xs text-muted-foreground mt-1">
                {metricArgs.startDate.toLocaleDateString()} -{' '}
                {metricArgs.endDate.toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
        {error && <p className="text-red-500">{error}</p>}
      </Tabs>
    </div>
  );
};

export const MetricsPageSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="h-8 w-24 bg-muted rounded animate-pulse" />

    {/* Tabs and Date Range Picker */}
    <div className="flex items-center justify-between">
      <div className="grid grid-cols-4 gap-1 bg-muted rounded-lg p-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 bg-background rounded animate-pulse" />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-muted rounded animate-pulse" />
        <div className="h-9 w-40 bg-muted rounded animate-pulse" />
      </div>
    </div>

    {/* Filter Controls */}
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-9 w-32 bg-muted rounded animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            {i === 1 && <div className="h-4 w-4 bg-muted rounded animate-pulse" />}
            <div className="h-9 w-24 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-9 w-16 bg-muted rounded animate-pulse" />
    </div>

    {/* Main Chart Card */}
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-8 w-28 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>

    {/* Total Amount Card */}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        <div className="h-4 w-4 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-24 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1" />
        <div className="h-4 w-28 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  </div>
);
