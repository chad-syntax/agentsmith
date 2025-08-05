import { OpenrouterNonStreamingResponse, OpenrouterRequestBody, ToolCall } from '@/lib/openrouter';
export type { Message } from '@/lib/openrouter';

export type GenericPromptVersion = {
  version: string;
  config: any;
  content: string;
  variables?: Record<string, string | number | boolean | any>;
};

export type GenericPrompt = {
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

export type PromptsWithLatest<CurAgency extends GenericAgency> = {
  [Slug in keyof CurAgency['prompts']]: CurAgency['prompts'][Slug]['versions']['latest'] extends never
    ? never
    : Slug;
}[keyof CurAgency['prompts']] &
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
> = keyof {
  [K in keyof CurAgency['prompts'][Slug]['versions'] as CurAgency['prompts'][Slug]['versions'][K] extends never
    ? never
    : K]: CurAgency['prompts'][Slug]['versions'][K];
} &
  string;

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
  | PromptsWithLatest<CurAgency> // Plain slugs like 'hello-world'
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

export type ParsePromptArg<T extends string> = T extends `${infer Slug}@${infer Version}`
  ? { slug: Slug; version: Version }
  : { slug: T; version: 'latest' };

// Types from OpenRouter
// Based on: https://openrouter.ai/docs/api-reference/overview#responses
export type ResponseFormat = {
  type: 'json_schema';
  json_schema: any; // Keeping this simple for now
};

export type CompletionConfig = Omit<OpenrouterRequestBody, 'messages' | 'prompt'>;

export type CompileOptions<Agency extends GenericAgency> = {
  globals?: Partial<{ [K in keyof Agency['globals']]: string }>;
};

export type ExecuteOptions<Agency extends GenericAgency> = {
  globals?: Partial<{ [K in keyof Agency['globals']]: string }>;
  config?: CompletionConfig;
};

export interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export type GetPromptConfig<
  CurAgency extends GenericAgency,
  T extends PromptIdentifier<CurAgency>,
> =
  ParsePromptArg<T> extends { slug: infer Slug; version: infer Version }
    ? Slug extends AgencyPromptSlugs<CurAgency>
      ? Version extends AllPromptVersionKeys<CurAgency, Slug>
        ? CurAgency['prompts'][Slug]['versions'][Version]['config']
        : never
      : never
    : never;

export type GetPromptContent<
  CurAgency extends GenericAgency,
  T extends PromptIdentifier<CurAgency>,
> =
  ParsePromptArg<T> extends { slug: infer Slug; version: infer Version }
    ? Slug extends AgencyPromptSlugs<CurAgency>
      ? Version extends AllPromptVersionKeys<CurAgency, Slug>
        ? CurAgency['prompts'][Slug]['versions'][Version]['content']
        : never
      : never
    : never;

export type ExecuteStreamingResult = {
  tokens: AsyncGenerator<string | undefined, void, unknown>;
  reasoningTokens: AsyncGenerator<string | undefined, void, unknown>;
  toolCalls: AsyncGenerator<ToolCall, void, unknown>;
  completion: Promise<OpenrouterNonStreamingResponse>;
  stream: ReadableStream<Uint8Array>;
  logUuid: Promise<string | undefined>;
  response: Response;
  compiledPrompt: string;
  finalVariables: any;
};

export type ExecuteNonStreamingResult = {
  completion: OpenrouterNonStreamingResponse;
  logUuid: Promise<string | undefined>;
  response: Response;
  content: string | null;
  reasoning: string | null;
  compiledPrompt: string;
  toolCalls: ToolCall[] | null;
  finalVariables: any;
};

// This helper extracts the type of the 'stream' property from the runtime options.
// It will be `true`, `false`, or `undefined`.
type OptionsStream<Options extends ExecuteOptions<any> | undefined> = Options extends {
  config?: { stream?: infer S };
}
  ? S
  : undefined;

// This helper determines the final stream setting by checking for an override in
// the runtime options. If no override is present, it falls back to the static
// configuration of the prompt version.
type FinalStreamSetting<
  CurAgency extends GenericAgency,
  PromptArg extends PromptIdentifier<CurAgency>,
  Options extends ExecuteOptions<CurAgency> | undefined,
> =
  OptionsStream<Options> extends undefined
    ? GetPromptConfig<CurAgency, PromptArg>['stream']
    : OptionsStream<Options>;

// The ExecuteResult is a conditional type that resolves to either the streaming
// or non-streaming result type based on the final, computed stream setting.
export type ExecuteResult<
  CurAgency extends GenericAgency,
  PromptArg extends PromptIdentifier<CurAgency>,
  Options extends ExecuteOptions<CurAgency> | undefined,
> =
  FinalStreamSetting<CurAgency, PromptArg, Options> extends true
    ? ExecuteStreamingResult
    : ExecuteNonStreamingResult;

export type ExecuteResultNoOptions<
  CurAgency extends GenericAgency,
  PromptArg extends PromptIdentifier<CurAgency>,
> = GetPromptConfig<CurAgency, PromptArg>['stream'] extends true
  ? ExecuteStreamingResult
  : ExecuteNonStreamingResult;

export type ExecuteImplementationResult<
  CurAgency extends GenericAgency,
  PromptArg extends PromptIdentifier<CurAgency>,
> =
  | ExecuteResult<CurAgency, PromptArg, ExecuteOptions<CurAgency>>
  | ExecuteResultNoOptions<CurAgency, PromptArg>;

export type CompileResult = {
  compiledPrompt: string;
  finalVariables: any;
};

export type CompileSignature<
  CurAgency extends GenericAgency,
  PromptArg extends PromptIdentifier<CurAgency>,
> =
  HasRequiredKeys<GetPromptVariables<CurAgency, PromptArg>> extends true
    ? (
        variables: GetPromptVariables<CurAgency, PromptArg>,
        options?: CompileOptions<CurAgency>,
      ) => Promise<CompileResult>
    : {
        (
          variables: GetPromptVariables<CurAgency, PromptArg>,
          options?: CompileOptions<CurAgency>,
        ): Promise<CompileResult>;
        (options?: CompileOptions<CurAgency>): Promise<CompileResult>;
      };

export type ExecuteSignature<
  CurAgency extends GenericAgency,
  PromptArg extends PromptIdentifier<CurAgency>,
> =
  HasRequiredKeys<GetPromptVariables<CurAgency, PromptArg>> extends true
    ? {
        <Options extends ExecuteOptions<CurAgency>>(
          variables: GetPromptVariables<CurAgency, PromptArg>,
          options: Options,
        ): Promise<ExecuteResult<CurAgency, PromptArg, Options>>;
        (
          variables: GetPromptVariables<CurAgency, PromptArg>,
        ): Promise<ExecuteResultNoOptions<CurAgency, PromptArg>>;
      }
    : {
        <Options extends ExecuteOptions<CurAgency>>(
          variables: GetPromptVariables<CurAgency, PromptArg>,
          options: Options,
        ): Promise<ExecuteResult<CurAgency, PromptArg, Options>>;
        (
          variables: GetPromptVariables<CurAgency, PromptArg>,
        ): Promise<ExecuteResultNoOptions<CurAgency, PromptArg>>;
        <Options extends ExecuteOptions<CurAgency>>(
          options: Options,
        ): Promise<ExecuteResult<CurAgency, PromptArg, Options>>;
        (): Promise<ExecuteResultNoOptions<CurAgency, PromptArg>>;
      };
