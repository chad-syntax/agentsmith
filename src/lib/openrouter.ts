// Typings in this file were manually copied from:
// https://openrouter.ai/docs/api-reference/overview#responses

// If these seem out of date, check the Openrouter API docs:

export type ProviderName =
  | 'OpenAI'
  | 'Anthropic'
  | 'Google'
  | 'Google AI Studio'
  | 'Amazon Bedrock'
  | 'Groq'
  | 'SambaNova'
  | 'Cohere'
  | 'Mistral'
  | 'Together'
  | 'Together 2'
  | 'Fireworks'
  | 'DeepInfra'
  | 'Lepton'
  | 'Novita'
  | 'Avian'
  | 'Lambda'
  | 'Azure'
  | 'Modal'
  | 'AnyScale'
  | 'Replicate'
  | 'Perplexity'
  | 'Recursal'
  | 'OctoAI'
  | 'DeepSeek'
  | 'Infermatic'
  | 'AI21'
  | 'Featherless'
  | 'Inflection'
  | 'xAI'
  | 'Cloudflare'
  | 'SF Compute'
  | 'Minimax'
  | 'Nineteen'
  | 'Liquid'
  | 'InferenceNet'
  | 'Friendli'
  | 'AionLabs'
  | 'Alibaba'
  | 'Nebius'
  | 'Chutes'
  | 'Kluster'
  | 'Crusoe'
  | 'Targon'
  | 'Ubicloud'
  | 'Parasail'
  | '01.AI'
  | 'HuggingFace'
  | 'Mancer'
  | 'Mancer 2'
  | 'Hyperbolic'
  | 'Hyperbolic 2'
  | 'Lynn 2'
  | 'Lynn'
  | 'Reflection';

export type QuantizationLevel =
  | 'int4'
  | 'int8'
  | 'fp4'
  | 'fp6'
  | 'fp8'
  | 'fp16'
  | 'bf16'
  | 'fp32'
  | 'unknown';

export type DataCollectionSetting = 'deny' | 'allow';

export type SortStrategy = 'price' | 'throughput' | 'latency';

export type ProviderPreferencesSchema = {
  /**
   * Whether to allow backup providers to serve requests
   * - true: (default) when the primary provider (or your custom providers in "order") is unavailable, use the next best provider.
   * - false: use only the primary/custom provider, and return the upstream error if it's unavailable.
   */
  allow_fallbacks?: boolean | null;

  /**
   * Whether to filter providers to only those that support the parameters you've provided.
   * If this setting is omitted or set to false, then providers will receive only the parameters
   * they support, and ignore the rest.
   */
  require_parameters?: boolean | null;

  /**
   * Data collection setting. If no available model provider meets the requirement, your request will return an error.
   * - allow: (default) allow providers which store user data non-transiently and may train on it
   * - deny: use only providers which do not collect user data.
   */
  data_collection?: DataCollectionSetting | null;

  /**
   * An ordered list of provider names. The router will attempt to use the first provider
   * in the subset of this list that supports your requested model, and fall back to the next
   * if it is unavailable. If no providers are available, the request will fail with an error message.
   */
  order?: ProviderName[] | null;

  /**
   * List of provider names to ignore. If provided, this list is merged with your
   * account-wide ignored provider settings for this request.
   */
  ignore?: ProviderName[] | null;

  /**
   * A list of quantization levels to filter the provider by.
   */
  quantizations?: QuantizationLevel[] | null;

  /**
   * The sorting strategy to use for this request, if "order" is not specified.
   * When set, no load balancing is performed.
   */
  sort?: SortStrategy | null;
};

// https://openrouter.ai/docs/features/web-search
type WebPlugin = {
  id: 'web';
  max_results: number; // Defaults to 5
  /**
   * Search prompt default at time of writing (check the docs for updates):
   *
   * A web search was conducted on `date`. Incorporate the following web search results into your response.
   *
   * IMPORTANT: Cite them using markdown links named using the domain of the source.
   * Example: [nytimes.com](https://nytimes.com/some-page).
   *
   */
  search_prompt: string;
};

type OpenrouterPlugin = WebPlugin;

// Basic JSON Schema types
export type JSONSchemaType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'integer'
  | 'object'
  | 'array'
  | 'null';

// Property definition for JSON Schema
export type JSONSchemaPropertyDefinition = {
  type?: JSONSchemaType | JSONSchemaType[]; // Allows type unions like ["string", "null"]
  description?: string;
  enum?: any[];
  items?: JSONSchemaPropertyDefinition | { $ref: string };
  properties?: Record<string, JSONSchemaPropertyDefinition>;
  required?: string[];
  additionalProperties?: boolean;
  anyOf?: JSONSchemaPropertyDefinition[];
  $ref?: string; // For schema references
};

// Schema definition
export type JSONSchemaDefinition = {
  type: JSONSchemaType | JSONSchemaType[];
  description?: string;
  properties?: Record<string, JSONSchemaPropertyDefinition>;
  required?: string[];
  additionalProperties?: boolean;
  anyOf?: JSONSchemaPropertyDefinition[];
  $defs?: Record<string, JSONSchemaDefinition>; // For schema definitions
  items?: JSONSchemaPropertyDefinition | { $ref: string };
};

// JSON Schema configuration
export type JSONSchema = {
  name?: string;
  strict: boolean; // Must be true for Structured Outputs
  schema: JSONSchemaDefinition;
};

// Structured Outputs Response Format
export type ResponseFormat = {
  type: 'json_schema';
  json_schema: JSONSchema;
};

// Definitions of subtypes are below
export type OpenrouterRequestBody = {
  // Either "messages" or "prompt" is required
  messages?: Message[];
  prompt?: string;

  // If "model" is unspecified, uses the user's default
  model?: string; // See "Supported Models" section

  // Allows to force the model to produce specific output format.
  // See models page and note on this docs page for which models support it.
  response_format?: ResponseFormat;

  stop?: string | string[];
  stream?: boolean; // Enable streaming

  // See LLM Parameters (openrouter.ai/docs/api-reference/parameters)
  max_tokens?: number; // Range: [1, context_length)
  temperature?: number; // Range: [0, 2]

  // Tool calling
  // Will be passed down as-is for providers implementing OpenAI's interface.
  // For providers with custom interfaces, we transform and map the properties.
  // Otherwise, we transform the tools into a YAML template. The model responds with an assistant message.
  // See models supporting tool calling: openrouter.ai/models?supported_parameters=tools
  tools?: Tool[];
  tool_choice?: ToolChoice;

  // Advanced optional parameters
  seed?: number; // Integer only
  top_p?: number; // Range: (0, 1]
  top_k?: number; // Range: [1, Infinity) Not available for OpenAI models
  frequency_penalty?: number; // Range: [-2, 2]
  presence_penalty?: number; // Range: [-2, 2]
  repetition_penalty?: number; // Range: (0, 2]
  logit_bias?: { [key: number]: number };
  top_logprobs?: number; // Integer only
  min_p?: number; // Range: [0, 1]
  top_a?: number; // Range: [0, 1]

  // Reduce latency by providing the model with a predicted output
  // https://platform.openai.com/docs/guides/latency-optimization#use-predicted-outputs
  prediction?: { type: 'content'; content: string };

  // OpenRouter-only parameters
  // See "Prompt Transforms" section: openrouter.ai/docs/transforms
  transforms?: string[];
  // See "Model Routing" section: openrouter.ai/docs/model-routing
  models?: string[];
  route?: 'fallback';
  // See "Provider Routing" section: openrouter.ai/docs/provider-routing
  provider?: ProviderPreferencesSchema;
  plugins?: OpenrouterPlugin[];
};

export type CompletionConfig = Omit<
  OpenrouterRequestBody,
  'messages' | 'prompt'
>;

// Subtypes:

export type TextContent = {
  type: 'text';
  text: string;
};

export type ImageContentPart = {
  type: 'image_url';
  image_url: {
    url: string; // URL or base64 encoded image data
    detail?: string; // Optional, defaults to "auto"
  };
};

export type ContentPart = TextContent | ImageContentPart;

export type Message =
  | {
      role: 'user' | 'assistant' | 'system';
      // ContentParts are only for the "user" role:
      content: string | ContentPart[];
      // If "name" is included, it will be prepended like this
      // for non-OpenAI models: `{name}: {content}`
      name?: string;
    }
  | {
      role: 'tool';
      content: string;
      tool_call_id: string;
      name?: string;
    };

export type FunctionDescription = {
  description?: string;
  name: string;
  parameters: object; // JSON Schema object
};

export type Tool = {
  type: 'function';
  function: FunctionDescription;
};

export type ToolChoice =
  | 'none'
  | 'auto'
  | {
      type: 'function';
      function: {
        name: string;
      };
    };

// If the provider returns usage, we pass it down
// as-is. Otherwise, we count using the GPT-4 tokenizer.

export type ResponseUsage = {
  /** Including images and tools if any */
  prompt_tokens: number;
  /** The tokens generated */
  completion_tokens: number;
  /** Sum of the above two fields */
  total_tokens: number;
};

// Subtypes:
export type NonChatChoice = {
  finish_reason: string | null;
  text: string;
  error?: ErrorResponse;
};

export type NonStreamingChoice = {
  finish_reason: string | null;
  native_finish_reason: string | null;
  message: {
    content: string | null;
    role: string;
    tool_calls?: ToolCall[];
  };
  error?: ErrorResponse;
};

export type StreamingChoice = {
  finish_reason: string | null;
  native_finish_reason: string | null;
  delta: {
    content: string | null;
    role?: string;
    tool_calls?: ToolCall[];
  };
  error?: ErrorResponse;
};

export type ErrorResponse = {
  code: number; // See "Error Handling" section
  message: string;
  metadata?: Record<string, unknown>; // Contains additional error information such as provider details, the raw error message, etc.
};

export type ToolCall = {
  id: string;
  type: 'function';
  // function: FunctionCall;
  function: any;
};

export type OpenrouterResponse = {
  id: string;
  // Depending on whether you set "stream" to "true" and
  // whether you passed in "messages" or a "prompt", you
  // will get a different output shape
  choices: (NonStreamingChoice | StreamingChoice | NonChatChoice)[];
  created: number; // Unix timestamp
  model: string;
  object: 'chat.completion' | 'chat.completion.chunk';

  system_fingerprint?: string; // Only present if the provider supports it

  // Usage data is always returned for non-streaming.
  // When streaming, you will get one usage object at
  // the end accompanied by an empty choices array.
  usage?: ResponseUsage;
};

export type OpenrouterModel = {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: number;
    completion: number;
  };
};

export const OPENROUTER_OAUTH_PKCE_URL =
  'https://openrouter.ai/api/v1/auth/keys';

export const OPENROUTER_HEADERS = {
  'HTTP-Referer': 'https://agentsmith.app',
  'X-Title': 'Agentsmith',
  'Content-Type': 'application/json',
};

export const OPENROUTER_COMPLETIONS_URL =
  'https://openrouter.ai/api/v1/chat/completions';

export const DEFAULT_OPENROUTER_MODEL = 'openrouter/auto';
export const MAX_OPENROUTER_MODELS = 3;

export const fetchOpenrouterModels = async () => {
  const response = await fetch('https://openrouter.ai/api/v1/models');
  const data = await response.json();
  return data as OpenrouterModel[];
};

export const fetchFreeOpenrouterModels = async () => {
  const models = await fetchOpenrouterModels();
  return models.filter((model) => model.id.includes('free'));
};

export const DEFAULT_OPENROUTER_CONFIG: CompletionConfig = {
  models: ['openrouter/auto'],
  temperature: 1,
};
