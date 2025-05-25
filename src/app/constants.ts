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

// // Extended RoadmapItem type for client-side state
// export type RoadmapItem = APIRoadmapItem & {
//   currentUserUpvoted?: boolean;
//   currentUserScore?: number | null;
// };
