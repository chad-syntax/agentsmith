import typesafeSdkCover from '@/assets/typesafe_sdk_cover.jpg';
import promptAuthoringCover from '@/assets/prompt_authoring_cover.jpg';
import gitPoweredHandoffCover from '@/assets/git_powered_handoff_cover.jpg';

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

// Define valid states and scores as constants for reference if needed, but types will be broader
export const VALID_ROADMAP_ITEM_STATES = [
  'PROPOSED',
  'REJECTED',
  'PLANNED',
  'IN_PROGRESS',
  'CANCELLED',
  'COMPLETED',
] as const;

export const VALID_ROADMAP_SCORES = [1, 2, 3, 4, 5] as const;

// Shared constants
export const VALID_STATUSES = [...VALID_ROADMAP_ITEM_STATES] as const;
export type RoadmapStatus = (typeof VALID_STATUSES)[number];

export const statusDisplayNames: Record<RoadmapStatus, string> = {
  PROPOSED: 'Proposed',
  REJECTED: 'Rejected',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const LANDING_VIDEOS = {
  typesafeSdk: {
    mp4: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/typesafe-sdk/typesafe-3u8HqGxAObETeX2ispm5QSch5yDKLJ.mp4',
    webm: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/typesafe-sdk/typesafe-DIKWyjTXMrOMiCnjCQLHqLVasfgeBB.webm',
    cover: typesafeSdkCover,
    buttonText: 'Typesafe SDK',
    copy: 'Eliminate runtime errors with our typesafe SDK. Compile-time checks and type hints ensure correct prompt usage and variable handling.',
  },
  promptAuthoring: {
    mp4: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/prompt-authoring/prompt_authoring-1I7A2b3AEL46w8Br4kc0am4RJ3Dvyp.mp4',
    webm: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/prompt-authoring/prompt_authoring-p80fYfch6kdnsgPg1B0jNpesooAqBe.webm',
    cover: promptAuthoringCover,
    buttonText: 'Prompt Authoring',
    copy: 'Centralized prompt authoring for technical & non-technical users. Auto-detect variables and ensure version sync for seamless collaboration.',
  },
  gitPoweredHandoff: {
    mp4: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/git-powered-handoff/git_powered_handoff-x1bQnErTy5qz0IjeXgwOUxz4QI31D8.mp4',
    webm: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/git-powered-handoff/git_powered_handoff-DuDeHUDZSeGACfJmD9NeqTjDjDuQ4G.webm',
    cover: gitPoweredHandoffCover,
    buttonText: 'Git-Powered Handoff',
    copy: 'Sync authors and engineers with automated Pull Requests for prompt and variable changes, keeping developers updated.',
  },
} as const;
