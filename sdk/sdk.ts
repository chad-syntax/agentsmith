import nunjucks from 'nunjucks';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/app/__generated__/supabase.types';

export interface AgentsmithClientOptions {
  baseUrl?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

const defaultOptions: AgentsmithClientOptions = {
  baseUrl: 'https://agentsmith.app',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export interface ExecutePromptOptions {
  stream?: boolean;
  projectId?: number;
}

export class AgentsmithClient {
  private apiKey: string;
  private options: AgentsmithClientOptions;
  private supabase: ReturnType<typeof createSupabaseClient<Database>>;

  constructor(apiKey: string, options: AgentsmithClientOptions = {}) {
    this.apiKey = apiKey;
    this.options = {
      ...defaultOptions,
      ...options,
    };

    if (!this.options.supabaseUrl || !this.options.supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }

    this.supabase = createSupabaseClient<Database>(
      this.options.supabaseUrl,
      this.options.supabaseKey,
    );
  }

  async getPrompt(promptUuid: string) {
    // Fetch the prompt from Supabase
    const { data: prompts, error } = await this.supabase
      .from('prompts')
      .select(
        `
        *,
        prompt_versions(*, prompt_variables(*))
      `,
      )
      .eq('uuid', promptUuid)
      .limit(1);

    if (error) {
      throw new Error(`Error fetching prompt: ${error.message}`);
    }

    if (!prompts || prompts.length === 0) {
      throw new Error(`Prompt ${promptUuid} not found`);
    }

    const prompt = prompts[0];
    const versions = prompt.prompt_versions || [];

    // Sort versions by created_at in descending order
    const sortedVersions = [...versions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const latestVersion = sortedVersions.length > 0 ? sortedVersions[0] : null;

    if (!latestVersion) {
      throw new Error(`No versions found for prompt ${promptUuid}`);
    }

    const variables = latestVersion.prompt_variables || [];

    return {
      prompt,
      latestVersion,
      variables,
    };
  }

  async executePrompt(
    promptUuid: string,
    parameters: Record<string, any>,
    options: ExecutePromptOptions = {},
  ): Promise<{ content: string }> {
    const { latestVersion, variables } = await this.getPrompt(promptUuid);

    // Validate parameters against variables
    for (const variable of variables) {
      const paramValue = parameters[variable.name];

      // Check required variables
      if (variable.required && (paramValue === undefined || paramValue === null)) {
        throw new Error(`Missing required variable: ${variable.name}`);
      }

      // Check types if value is provided
      if (paramValue !== undefined && paramValue !== null) {
        const actualType = typeof paramValue;
        const expectedType = variable.type.toLowerCase();

        if (
          (expectedType === 'string' && actualType !== 'string') ||
          (expectedType === 'number' && actualType !== 'number') ||
          (expectedType === 'boolean' && actualType !== 'boolean')
        ) {
          throw new Error(
            `Invalid type for variable ${variable.name}: expected ${expectedType}, got ${actualType}`,
          );
        }

        // Check for empty strings in required string variables
        if (expectedType === 'string' && variable.required && paramValue === '') {
          throw new Error(`Required string variable ${variable.name} cannot be empty`);
        }
      }
    }

    // Compile the prompt with the parameters
    const compiledPrompt = nunjucks.renderString(latestVersion.content, parameters);

    // In a real implementation, we would make an API call to execute the prompt
    console.log(`Executing prompt ${promptUuid} with parameters:`, parameters);
    console.log('Compiled prompt:', compiledPrompt);

    // For now, just return a mock response
    return {
      content: `Response for ${promptUuid}: ${compiledPrompt.substring(0, 50)}...`,
    };
  }
}
