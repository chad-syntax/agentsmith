import type { Agency, PromptVariable } from '../lib/agency.types';
import nunjucks from 'nunjucks';
import { __DUMMY_AGENTS__, __DUMMY_PROMPTS__ } from '@/app/constants';

export interface AgentsmithClientOptions {
  baseUrl?: string;
}

export interface AgentsmithInstanceContext {
  user?: Record<string, any>;
  [key: string]: any;
}

const defaultOptions: AgentsmithClientOptions = {
  baseUrl: 'https://agentsmith.app',
};

// Helper type for a single prompt variable
type PromptVariableType<Type, Required extends boolean> = Required extends true
  ? Type
  : Type | undefined;

// Helper type to convert the variable definition to its corresponding type
type VariableToType<Type, Required extends boolean> = Type extends 'string'
  ? PromptVariableType<string, Required>
  : Type extends 'number'
    ? PromptVariableType<number, Required>
    : Type extends 'boolean'
      ? PromptVariableType<boolean, Required>
      : never;

export type ExtractPromptVariables<
  T extends Agency,
  S extends keyof T['prompts'],
> = T['prompts'][S] extends {
  variables: { name: infer K; type: infer Type; required: boolean }[];
}
  ? {
      [P in K & string]: VariableToType<Type, boolean>;
    }
  : never;

export class Prompt<T extends Agency, S extends keyof T['prompts']> {
  constructor(
    private content: string,
    private variables: PromptVariable[]
  ) {}

  compile(variables: ExtractPromptVariables<T, S>): string {
    // Check for unknown variables
    const knownVariables = new Set(this.variables.map((v) => v.name));
    for (const key of Object.keys(variables)) {
      if (!knownVariables.has(key)) {
        throw new Error(`Unknown variable: ${key}`);
      }
    }

    // Check variable types and empty strings
    this.variables.forEach((v) => {
      if (v.name in variables) {
        const value = variables[v.name as keyof typeof variables];
        if (value !== undefined) {
          const actualType = typeof value;
          const expectedType = v.type;
          if (
            (expectedType === 'string' && actualType !== 'string') ||
            (expectedType === 'number' && actualType !== 'number') ||
            (expectedType === 'boolean' && actualType !== 'boolean')
          ) {
            throw new Error(
              `Invalid type for variable ${v.name}: expected ${expectedType}, got ${actualType}`
            );
          }
          // Check for empty strings in required string variables
          if (expectedType === 'string' && v.required && value === '') {
            throw new Error(
              `Required string variable ${v.name} cannot be empty`
            );
          }
        }
      } else if (v.required) {
        throw new Error(`Missing required variable: ${v.name}`);
      }
    });

    return nunjucks.renderString(this.content, variables);
  }
}

export class AgentsmithClient<T extends Agency> {
  private apiKey: string;
  private options: AgentsmithClientOptions;

  constructor(apiKey: string, options: AgentsmithClientOptions = {}) {
    this.apiKey = apiKey;
    this.options = {
      ...defaultOptions,
      ...options,
    };
  }

  async getPrompt<S extends keyof T['prompts']>(
    slug: S
  ): Promise<Prompt<T, S>> {
    const prompt = Object.values(__DUMMY_PROMPTS__).find(
      (p) => p.slug === String(slug)
    );
    if (!prompt) {
      throw new Error(`Prompt ${String(slug)} not found`);
    }
    return new Prompt<T, S>(prompt.content, prompt.variables);
  }

  async getAgent<S extends keyof T['agents']>(
    slug: S
  ): Promise<AgentsmithAgent<T>> {
    // In a real implementation, we would fetch agent details from the API
    // For now, just throw if it's not a known agent
    // if (slug !== 'lead_agent') {
    //   // Hardcoded for testing
    //   throw new Error(`Agent ${String(slug)} not found`);
    // }
    const agent = Object.values(__DUMMY_AGENTS__).find(
      (a) => a.slug === String(slug)
    );
    if (!agent) {
      throw new Error(`Agent ${String(slug)} not found`);
    }
    return new AgentsmithAgent<T>(this, String(slug));
  }
}

export class AgentsmithAgent<T extends Agency> {
  private client: AgentsmithClient<T>;
  private slug: string;

  constructor(client: AgentsmithClient<T>, slug: string) {
    this.client = client;
    this.slug = slug;
  }

  async createInstance(
    context: AgentsmithInstanceContext = {}
  ): Promise<AgentsmithInstance<T>> {
    return new AgentsmithInstance<T>(this.client, this.slug, context);
  }
}

export class AgentsmithInstance<T extends Agency> {
  private client: AgentsmithClient<T>;
  private agentSlug: string;
  private context: AgentsmithInstanceContext;

  constructor(
    client: AgentsmithClient<T>,
    agentSlug: string,
    context: AgentsmithInstanceContext
  ) {
    this.client = client;
    this.agentSlug = agentSlug;
    this.context = context;
  }

  async action<S extends keyof T['prompts']>(
    actionSlug: S,
    parameters: ExtractPromptVariables<T, S>
  ): Promise<{ content: string }> {
    // In a real implementation, we would make an API call here
    console.log(
      `Executing action ${String(actionSlug)} with parameters:`,
      parameters
    );
    return {
      content: `Mocked response for ${String(actionSlug)}`,
    };
  }
}
