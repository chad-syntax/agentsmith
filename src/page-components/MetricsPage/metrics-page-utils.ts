import { GetMetricsDataResult, GetMetricsDataOptions } from '@/lib/MetricsService';
import {
  MetricTab,
  METRIC_CHART_CONFIGS,
  METRIC_SUFFIXES,
  METRIC_DATA_KEYS,
} from './metrics-page-constants';

// Calculate totals from current metrics data
export const calculateTotals = (chartData: GetMetricsDataResult) => {
  if (!chartData || chartData.length === 0) {
    return {
      tokens: 0,
      cost: 0,
      duration: 0,
      requests: 0,
    };
  }

  const totalTokens = chartData.reduce((sum, item) => sum + (item.total_tokens || 0), 0);
  const totalCost = chartData.reduce((sum, item) => sum + (item.total_cost || 0), 0);
  const totalRequests = chartData.reduce((sum, item) => sum + (item.request_count || 0), 0);

  // Calculate average duration weighted by request count
  const totalDurationWeighted = chartData.reduce(
    (sum, item) => sum + (item.avg_duration_ms || 0) * (item.request_count || 0),
    0,
  );
  const avgDuration = totalRequests > 0 ? totalDurationWeighted / totalRequests : 0;

  return {
    tokens: totalTokens,
    cost: totalCost,
    duration: avgDuration,
    requests: totalRequests,
  };
};

// Format total value based on active tab
export const formatTotalValue = (value: number, tab: MetricTab) => {
  switch (tab) {
    case 'tokens':
      return value.toLocaleString();
    case 'cost':
      return `$${value.toFixed(4)}`;
    case 'duration':
      return `${Math.round(value)}ms`;
    case 'requests':
      return value.toLocaleString();
    default:
      return value.toString();
  }
};

// Get current total based on active tab
export const getCurrentTotal = (
  totals: ReturnType<typeof calculateTotals>,
  activeTab: MetricTab,
) => {
  switch (activeTab) {
    case 'tokens':
      return totals.tokens;
    case 'cost':
      return totals.cost;
    case 'duration':
      return totals.duration;
    case 'requests':
      return totals.requests;
    default:
      return 0;
  }
};

// Determine bucket type based on date range (matching SQL function logic)
export const getBucketType = (metricArgs: Omit<GetMetricsDataOptions, 'projectId'> | null) => {
  if (!metricArgs) return 'hour';

  const diffTime = Math.abs(metricArgs.endDate.getTime() - metricArgs.startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) return 'hour';
  if (diffDays <= 7) return 'fourhour';
  if (diffDays <= 30) return 'day';
  return 'week';
};

// Format X axis labels based on bucket type
export const formatXAxisLabel = (
  timestamp: string,
  metricArgs: Omit<GetMetricsDataOptions, 'projectId'> | null,
) => {
  const date = new Date(timestamp);
  const bucketType = getBucketType(metricArgs);

  switch (bucketType) {
    case 'hour':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'fourhour':
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    case 'day':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    case 'week':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    default:
      return date.toLocaleDateString();
  }
};

// Format tooltip label based on bucket type
export const formatTooltipLabel = (
  timestamp: string,
  metricArgs: Omit<GetMetricsDataOptions, 'projectId'> | null,
) => {
  const date = new Date(timestamp);
  const bucketType = getBucketType(metricArgs);

  switch (bucketType) {
    case 'hour':
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    case 'fourhour':
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    case 'day':
      return `${date.toLocaleDateString()}`;
    case 'week':
      return `Week of ${date.toLocaleDateString()}`;
    default:
      return date.toLocaleDateString();
  }
};

// Transform grouped data for multi-series chart
export const transformGroupedData = (
  chartData: GetMetricsDataResult,
  metricArgs: Omit<GetMetricsDataOptions, 'projectId'> | null,
) => {
  if (!metricArgs?.groupBy || !chartData.length) {
    return chartData;
  }

  // Get unique timestamps and group dimensions
  const timestamps = Array.from(new Set(chartData.map((item) => item.bucket_timestamp))).sort();
  const groups = Array.from(new Set(chartData.map((item) => item.group_dimension))).sort();

  // Transform into multi-series format
  return timestamps.map((timestamp) => {
    const dataPoint: any = { bucket_timestamp: timestamp };

    groups.forEach((group) => {
      const groupData = chartData.find(
        (item) => item.bucket_timestamp === timestamp && item.group_dimension === group,
      );

      if (groupData) {
        dataPoint[`${group}${METRIC_SUFFIXES.tokens}`] = groupData.total_tokens;
        dataPoint[`${group}${METRIC_SUFFIXES.cost}`] = groupData.total_cost;
        dataPoint[`${group}${METRIC_SUFFIXES.requests}`] = groupData.request_count;
        dataPoint[`${group}${METRIC_SUFFIXES.duration}`] = groupData.avg_duration_ms;
      } else {
        dataPoint[`${group}${METRIC_SUFFIXES.tokens}`] = 0;
        dataPoint[`${group}${METRIC_SUFFIXES.cost}`] = 0;
        dataPoint[`${group}${METRIC_SUFFIXES.requests}`] = 0;
        dataPoint[`${group}${METRIC_SUFFIXES.duration}`] = 0;
      }
    });

    return dataPoint;
  });
};

// Get unique groups for multi-series chart
export const getChartGroups = (
  chartData: GetMetricsDataResult,
  metricArgs: Omit<GetMetricsDataOptions, 'projectId'> | null,
): string[] => {
  if (!metricArgs?.groupBy || !chartData.length) {
    return [];
  }
  return Array.from(new Set(chartData.map((item) => item.group_dimension))).sort();
};

// Generate dynamic chart configuration for grouped data
export const getDynamicChartConfig = (
  metricArgs: Omit<GetMetricsDataOptions, 'projectId'> | null,
  activeTab: MetricTab,
  chartGroups: string[],
) => {
  if (!metricArgs?.groupBy) {
    return METRIC_CHART_CONFIGS[activeTab as MetricTab];
  }

  const config: any = {};
  const chartColors = [
    'var(--color-primary)', // Blue
    'var(--color-secondary)', // Pink
    'var(--color-accent)', // Orange
    'var(--color-cyan-500)', // Cyan
    'var(--color-red-500)', // Red
  ];

  chartGroups.forEach((group, index) => {
    const suffix = METRIC_SUFFIXES[activeTab];
    const metricLabel =
      activeTab === 'tokens'
        ? 'Tokens'
        : activeTab === 'cost'
          ? 'Cost (USD)'
          : activeTab === 'requests'
            ? 'Requests'
            : 'Avg Duration (ms)';

    config[`${group}${suffix}`] = {
      label: `${group} ${metricLabel}`,
      color: chartColors[index % chartColors.length],
    };
  });

  return config;
};

// Format tooltip content based on active tab and groupBy state
export const formatTooltipContent = (
  value: any,
  name: any,
  metricArgs: Omit<GetMetricsDataOptions, 'projectId'> | null,
  activeTab: MetricTab,
) => {
  if (!metricArgs?.groupBy) {
    return [
      value.toLocaleString(),
      ' ',
      activeTab === 'tokens'
        ? 'Tokens'
        : activeTab === 'cost'
          ? 'Cost (USD)'
          : activeTab === 'requests'
            ? 'Requests'
            : 'Avg Duration (ms)',
    ];
  } else {
    // Extract group name from dataKey (e.g., "GPT-4_tokens" -> "GPT-4")
    const suffix = METRIC_SUFFIXES[activeTab];
    const groupName = typeof name === 'string' ? name.replace(suffix, '') : 'Unknown';

    return [value.toLocaleString(), ' ', groupName];
  }
};
