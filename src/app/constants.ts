export const ORGANIZATION_KEYS = {
  OPENROUTER_API_KEY: 'OPENROUTER_API_KEY',
  OPENROUTER_CODE_VERIFIER: 'OPENROUTER_CODE_VERIFIER',
} as const;

export type OrganizationKeyType = keyof typeof ORGANIZATION_KEYS;

export const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export const HEADER_HEIGHT = 49;

export const STUDIO_FULL_HEIGHT = `h-[calc(100vh-${HEADER_HEIGHT}px)]`;

export const IS_WAITLIST_REDIRECT_ENABLED =
  process.env.VERCEL_TARGET_ENV === 'production' || process.env.VERCEL_TARGET_ENV === 'staging';
