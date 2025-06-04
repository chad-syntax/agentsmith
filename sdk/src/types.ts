export type GenericPromptVersion = {
  version: string;
  config: any;
  content: string;
  variables?: Record<string, string | number | boolean | any>;
};

export type GenericPrompt = {
  uuid: string;
  name: string;
  slug: string;
  versions: Record<string, GenericPromptVersion>;
};

export type GenericAgency = {
  prompts: Record<string, GenericPrompt>;
  globals: Record<string, any>;
};

/**
 * @template CurAgency - The agency type, extending GenericAgency.
 * @description Creates a union type of all valid prompt slugs from the agency.
 * This represents the keys of the prompts object in the agency type.
 * @example
 * type MyAgency = {
 *   prompts: {
 *     'prompt1': { ... },
 *     'prompt2': { ... }
 *   },
 *   globals: {}
 * };
 * type MyPromptSlugs = AgencyPromptSlugs<MyAgency>; // "prompt1" | "prompt2"
 */
export type AgencyPromptSlugs<CurAgency extends GenericAgency> = keyof CurAgency['prompts'] &
  string;

/**
 * @template CurAgency - The agency type, extending GenericAgency.
 * @template Slug - A prompt slug from the agency.
 * @description Extracts all version keys (e.g., '0.0.1', 'latest') for a specific prompt slug within an agency.
 * @example
 * type MyAgency = {
 *   prompts: {
 *     'my-prompt': {
 *       versions: {
 *         '0.0.1': { ... };
 *         'latest': { ... };
 *       }
 *     }
 *   },
 *   globals: {}
 * };
 * type PromptVersions = AllPromptVersionKeys<MyAgency, 'my-prompt'>; // "0.0.1" | "latest"
 */
export type AllPromptVersionKeys<
  CurAgency extends GenericAgency,
  Slug extends AgencyPromptSlugs<CurAgency>,
> = keyof CurAgency['prompts'][Slug]['versions'] & string;

/**
 * @template CurAgency - The agency type, extending GenericAgency.
 * @description Creates a union of all valid prompt identifier strings.
 * This can be either a plain slug (which defaults to the 'latest' version)
 * or a slug explicitly combined with a version string (e.g., 'slug@0.0.1').
 * @example
 * type MyAgency = {
 *   prompts: {
 *     'prompt1': { versions: { '0.0.1': {}, 'latest': {} } },
 *     'prompt2': { versions: { '1.0.0': {}, 'latest': {} } }
 *   },
 *   globals: {}
 * };
 * type MyPromptIDs = PromptIdentifier<MyAgency>; // "prompt1" | "prompt2" | "prompt1@0.0.1" | "prompt1@latest" | "prompt2@1.0.0" | "prompt2@latest"
 */
export type PromptIdentifier<CurAgency extends GenericAgency> =
  | AgencyPromptSlugs<CurAgency> // Plain slugs like 'hello-world'
  | {
      // Slug with @version or @latest, like 'hello-world@0.0.1' or 'hello-world@latest'
      [SPSlug in AgencyPromptSlugs<CurAgency>]: `${SPSlug}@${AllPromptVersionKeys<CurAgency, SPSlug>}`;
    }[AgencyPromptSlugs<CurAgency>];

// Helper to check if an object type T has any required keys.
// Returns true if T has required keys, false otherwise.
export type HasRequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T] extends never
  ? false
  : true;

/**
 * @template CurAgency - The agency type, extending GenericAgency.
 * @template T - A prompt identifier, either a slug or 'slug@version'.
 * @description Retrieves the type of the `variables` object for a specified prompt and version.
 * If only a slug is provided, it defaults to the 'latest' version of that prompt.
 * @example
 * type MyAgency = {
 *   prompts: {
 *     'greeting': {
 *       versions: {
 *         '0.0.1': { variables: { name: string; } },
 *         'latest': { variables: { title: string; name: string; } }
 *       }
 *     }
 *   },
 *   globals: {}
 * };
 * type GreetingLatestVars = GetPromptVariables<MyAgency, 'greeting'>; // { title: string; name: string; }
 * type GreetingSpecificVars = GetPromptVariables<MyAgency, 'greeting@0.0.1'>; // { name: string; }
 */
export type GetPromptVariables<
  CurAgency extends GenericAgency,
  T extends PromptIdentifier<CurAgency>,
> =
  // Case 1: T is in 'slug@version' format
  T extends `${infer Slug}@${infer Version}`
    ? Slug extends AgencyPromptSlugs<CurAgency>
      ? Version extends AllPromptVersionKeys<CurAgency, Slug>
        ? CurAgency['prompts'][Slug]['versions'][Version] extends { variables: infer V }
          ? V
          : Record<string, never> // Changed from never
        : Record<string, never> // Should not be reached, but added for completeness
      : Record<string, never> // Should not be reached
    : // Case 2: T is a plain 'slug' (implicitly means 'slug@latest')
      T extends AgencyPromptSlugs<CurAgency> // T must be one of the slugs
      ? 'latest' extends AllPromptVersionKeys<CurAgency, T> // Check if 'latest' is a valid version for this slug
        ? CurAgency['prompts'][T]['versions']['latest'] extends { variables: infer V } // Access variables of 'latest'
          ? V
          : Record<string, never> // Changed from never
        : Record<string, never> // Should ideally not be reached if 'latest' is always present for valid slugs
      : Record<string, never>; // Should not be reached due to T's constraint
