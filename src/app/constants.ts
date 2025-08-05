// the ts-ignore statements here are just for the npm run test:types command to pass

// @ts-ignore
import gitHandoffCover from '@/assets/landing-page-video-covers/git-handoff.jpg';
// @ts-ignore
import robustAuthoringCover from '@/assets/landing-page-video-covers/robust-authoring.jpg';
// @ts-ignore
import typedPromptsCover from '@/assets/landing-page-video-covers/typed-prompts.jpg';
// @ts-ignore
import unifiedApiCover from '@/assets/landing-page-video-covers/unified-api.jpg';
import { ShieldCheck, GitBranch, Shuffle, PencilLine } from 'lucide-react';

export const ORGANIZATION_KEYS = {
  OPENROUTER_API_KEY: 'OPENROUTER_API_KEY',
  OPENROUTER_CODE_VERIFIER: 'OPENROUTER_CODE_VERIFIER',
} as const;

export type OrganizationKeyType = keyof typeof ORGANIZATION_KEYS;

export const VERSION_TYPES = {
  patch: 'patch',
  minor: 'minor',
  major: 'major',
  custom: 'custom',
} as const;

export type VersionType = keyof typeof VERSION_TYPES;

export const VERSION_TYPE_LABELS = {
  [VERSION_TYPES.patch]: 'Patch',
  [VERSION_TYPES.minor]: 'Minor',
  [VERSION_TYPES.major]: 'Major',
  [VERSION_TYPES.custom]: 'Custom',
} as const;

export const VERSION_TYPE_DESCRIPTIONS = {
  [VERSION_TYPES.patch]:
    'A patch version indicates a bug fix or a small change that does not break existing functionality.',
  [VERSION_TYPES.minor]:
    'A minor version indicates a new feature or a significant change that does not break existing functionality.',
  [VERSION_TYPES.major]:
    'A major version indicates a significant change that may break existing functionality.',
  [VERSION_TYPES.custom]:
    'A custom version indicates a special case or label for a version, such as 1.2.3-rc.1 or 1.2.3-beta.1.',
} as const;

export const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export const HEADER_HEIGHT = 49;

export const STUDIO_FULL_HEIGHT = `h-[calc(100vh-${HEADER_HEIGHT}px)]`;

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
  robustAuthoring: {
    webm: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos-7-26-25/robust-authoring/robust-authoring-720-studio.webm',
    mp4: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos-7-26-25/robust-authoring/robust-authoring-720-web.mp4',
    cover: robustAuthoringCover,
    buttonText: 'Robust Authoring',
    copy: 'Centralized prompt authoring for prompt authors and engineers. Auto-detect variables and keep your prompts and config centralized.',
    icon: PencilLine,
    duration: 'PT1M1S',
  },
  typedPrompts: {
    webm: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos-7-26-25/typed-prompts/typed-prompts-720-studio.webm',
    mp4: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos-7-26-25/typed-prompts/typed-prompts-720-web.mp4',
    cover: typedPromptsCover,
    buttonText: 'Typed Prompts',
    copy: 'Feel secure with generated types, ensuring valid prompt inputs every time.',
    icon: ShieldCheck,
    duration: 'PT1M21S',
  },
  unifiedApi: {
    mp4: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos-7-26-25/unified-api/unified-api-720-web.mp4',
    webm: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos-7-26-25/unified-api/unified-api-720-studio.webm',
    cover: unifiedApiCover,
    buttonText: 'Unified API',
    copy: 'Access OpenAI, Google, Anthropic & more via one API (powered by OpenRouter). Switch models and providers easily, no writing wrappers for every provider.',
    icon: Shuffle,
    duration: 'PT28S',
  },
  gitHandoff: {
    mp4: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos-7-26-25/git-handoff/git-handoff-720-web.mp4',
    webm: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos-7-26-25/git-handoff/git-handoff-720-studio.webm',
    cover: gitHandoffCover,
    buttonText: 'Git Handoff',
    copy: 'Sync authors and engineers with automated Pull Requests for prompt and variable changes, keeping developers updated.',
    icon: GitBranch,
    duration: 'PT34S',
  },
} as const;
