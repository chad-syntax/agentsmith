// the ts-ignore statements here are just for the npm run test:types command to pass

// @ts-ignore
import gitHandoffCover from '@/assets/landing-page-video-covers/git-handoff.jpg';
// @ts-ignore
import robustAuthoringCover from '@/assets/landing-page-video-covers/robust-authoring.jpg';
// @ts-ignore
import typedPromptsCover from '@/assets/landing-page-video-covers/typed-prompts.jpg';
// @ts-ignore
import unifiedApiCover from '@/assets/landing-page-video-covers/unified-api.jpg';
import { ShieldCheck, Users, GitBranch, Shuffle } from 'lucide-react';

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
  typedPrompts: {
    mp4: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/typed-prompts/typed-prompts-pl6U2rBtIP8CVlXP4biYJyWhyTsjt1.mp4',
    webm: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/typed-prompts/typed-prompts-j87EivYizxYC0k8KO7At2fZ4niBFxF.webm',
    cover: typedPromptsCover,
    buttonText: 'Typed Prompts',
    copy: 'Feel secure with generated types, ensuring valid prompt inputs every time.',
    icon: ShieldCheck,
  },
  robustAuthoring: {
    mp4: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/robust-authoring/robust-authoring-3d6m5ZFrfUdAfDfgsgDsP0OfmjuKzE.mp4',
    webm: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/robust-authoring/robust-authoring-lvCDHWWWTIw6niCNlNOhxAwbZGkG5C.webm',
    cover: robustAuthoringCover,
    buttonText: 'Robust Authoring',
    copy: 'Centralized prompt authoring for prompt authors and engineers. Auto-detect variables and keep your prompts and config centralized.',
    icon: Users,
  },
  unifiedApi: {
    mp4: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/unified-api/unified-api-mzCW5KQxxc2qnfaL5deuIwFHrPrled.mp4',
    webm: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/unified-api/unified-api-EHX98SUPngchJj0fd46E4O4qvtBPFb.webm',
    cover: unifiedApiCover,
    buttonText: 'Unified API',
    copy: 'Access OpenAI, Google, Anthropic & more via one API (powered by OpenRouter). Switch models and providers easily, no writing wrappers for every provider.',
    icon: Shuffle,
  },
  gitHandoff: {
    mp4: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/git-handoff/git-handoff-t5K9wVhP44NYaho3FJ5vTMNkQFV3Wn.mp4',
    webm: 'https://kk9lsbugwddpmfy6.public.blob.vercel-storage.com/landing-videos/git-handoff/git-handoff-PCQrRyDkKaDBLlrXWbNMFVqrUQd0nu.webm',
    cover: gitHandoffCover,
    buttonText: 'Git Handoff',
    copy: 'Sync authors and engineers with automated Pull Requests for prompt and variable changes, keeping developers updated.',
    icon: GitBranch,
  },
} as const;
