import { Hash, DollarSign, Clock, ArrowRightLeft } from 'lucide-react';

export const METRIC_TABS = {
  tokens: 'tokens',
  cost: 'cost',
  duration: 'duration',
  requests: 'requests',
} as const;

export const METRIC_TAB_LABELS = {
  tokens: 'Tokens',
  cost: 'Cost',
  duration: 'Duration',
  requests: 'Requests',
} as const;

export const METRIC_TAB_ICONS = {
  tokens: <Hash className="w-4 h-4" />,
  cost: <DollarSign className="w-4 h-4" />,
  duration: <Clock className="w-4 h-4" />,
  requests: <ArrowRightLeft className="w-4 h-4" />,
} as const;

export const METRIC_TAB_TITLES = {
  tokens: 'Tokens Consumed',
  cost: 'Cost Incurred',
  duration: 'Duration of Requests',
  requests: 'Requests',
} as const;

export const METRIC_CHART_CONFIGS = {
  tokens: {
    tokens: {
      label: 'Tokens',
      color: 'var(--color-primary)',
    },
  },
  cost: {
    cost: {
      label: 'Cost (USD)',
      color: 'var(--color-secondary)',
    },
  },
  duration: {
    duration: {
      label: 'Avg Duration (ms)',
      color: 'var(--color-accent)',
    },
  },
  requests: {
    requests: {
      label: 'Requests',
      color: 'var(--color-cyan-500)',
    },
  },
} as const;

export type MetricTab = keyof typeof METRIC_TABS;

export const METRIC_SUFFIXES = {
  tokens: '_tokens',
  cost: '_cost',
  duration: '_duration',
  requests: '_requests',
} as const;

export const METRIC_DATA_KEYS = {
  tokens: 'total_tokens',
  cost: 'total_cost',
  duration: 'avg_duration_ms',
  requests: 'request_count',
} as const;

export const METRIC_FILTER_DROPDOWNS = {
  model: 'model',
  provider: 'provider',
  promptId: 'promptId',
  source: 'source',
} as const;

export type MetricFilterDropdown = keyof typeof METRIC_FILTER_DROPDOWNS;

export const METRIC_FILTER_DROPDOWN_KEYS = {
  model: 'models',
  provider: 'providers',
  promptId: 'prompts',
  source: 'sources',
} as const;

export const METRIC_FILTER_DROPDOWN_LABELS = {
  model: 'Model',
  provider: 'Provider',
  promptId: 'Prompt',
  source: 'Source',
} as const;

export const METRIC_FILTER_DROPDOWN_PLACEHOLDERS = {
  model: 'All models',
  provider: 'All providers',
  promptId: 'All prompts',
  source: 'All sources',
} as const;

export const METRIC_FILTER_DROPDOWN_DEFAULT_VALUES = {
  model: 'all-models',
  provider: 'all-providers',
  promptId: 'all-prompts',
  source: 'all-sources',
} as const;

export const GROUP_BY_OPTIONS = {
  none: 'None',
  model: 'Model',
  provider: 'Provider',
  prompt: 'Prompt',
  source: 'Source',
} as const;

export type GroupByOption = keyof typeof GROUP_BY_OPTIONS;
