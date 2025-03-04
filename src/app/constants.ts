export const ORGANIZATION_KEYS = {
  OPENROUTER_API_KEY: 'OPENROUTER_API_KEY',
  OPENROUTER_CODE_VERIFIER: 'OPENROUTER_CODE_VERIFIER',
} as const;

export type OrganizationKeyType = keyof typeof ORGANIZATION_KEYS;

export const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export const OPENROUTER_HEADERS = {
  'HTTP-Referer': 'https://agentsmith.app',
  'X-Title': 'Agentsmith',
  'Content-Type': 'application/json',
};

export const OPENROUTER_COMPLETIONS_URL =
  'https://openrouter.ai/api/v1/chat/completions';

export const DEFAULT_OPENROUTER_MODEL = 'openrouter/auto';
export const MAX_OPENROUTER_MODELS = 3;
