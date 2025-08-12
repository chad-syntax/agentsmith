import { SEMVER_PATTERN } from '@/app/constants';
import { GetAllPromptsDataResult } from '../PromptsService';
import { z } from 'zod';
import { compareSemanticVersions } from '@/utils/versioning';

// for some reason this keeps failing validation, so we're using a string for now
// const supabaseDatetime = z.string().datetime({ precision: 6, offset: true });
const supabaseDatetime = z.string();

const PromptJSONFileContentSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  latestVersion: z.string().nullable(),
  created_at: supabaseDatetime,
  updated_at: supabaseDatetime,
});

export type PromptJSONFileContent = z.infer<typeof PromptJSONFileContentSchema>;

// Schema for PromptVersionFileJSONContent
const PromptVersionFileJSONContentSchema = z.object({
  uuid: z.string().uuid(),
  config: z.any().nullable(), // Represents Json | null
  status: z.string(),
  version: z
    .string()
    .regex(SEMVER_PATTERN, { message: 'Version must be a valid semantic version (e.g., 1.0.0)' }),
  type: z.enum(['CHAT', 'NON_CHAT']).optional(),
  created_at: supabaseDatetime,
  updated_at: supabaseDatetime,
});

export type PromptVersionFileJSONContent = z.infer<typeof PromptVersionFileJSONContentSchema>;

// Schema for individual items in PromptVariableFileJSONContent
const PromptVariableItemSchema = z.object({
  name: z.string(),
  type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']), // From Database['public']['Enums']['variable_type']
  uuid: z.string().uuid(),
  required: z.boolean(),
  created_at: supabaseDatetime,
  updated_at: supabaseDatetime,
  default_value: z.union([z.number(), z.string(), z.any()]).nullable().optional(), // Represents number | string | Json | null
});

// Schema for PromptVariableFileJSONContent (array of items)
const PromptVariableFileJSONContentSchema = z.array(PromptVariableItemSchema);

export type PromptVariableFileJSONContent = z.infer<typeof PromptVariableFileJSONContentSchema>;

export const generatePromptJsonContent = (
  prompt: GetAllPromptsDataResult[number],
): PromptJSONFileContent => {
  const latestVersion =
    prompt.prompt_versions
      .filter((v) => v.status === 'PUBLISHED')
      .sort((a, b) => compareSemanticVersions(b.version, a.version))[0]?.version ?? null;

  return {
    uuid: prompt.uuid,
    name: prompt.name,
    slug: prompt.slug,
    latestVersion,
    created_at: prompt.created_at,
    updated_at: prompt.updated_at,
  };
};

export const generatePromptVersionJsonContent = (
  version: GetAllPromptsDataResult[number]['prompt_versions'][number],
): PromptVersionFileJSONContent => {
  return {
    uuid: version.uuid,
    config: version.config,
    status: version.status,
    version: version.version,
    created_at: version.created_at,
    updated_at: version.updated_at,
  };
};

export const generatePromptVariablesJsonContent = (
  variables: GetAllPromptsDataResult[number]['prompt_versions'][number]['prompt_variables'],
): PromptVariableFileJSONContent => {
  return variables.map((v) => ({
    name: v.name,
    type: v.type,
    uuid: v.uuid,
    required: v.required,
    created_at: v.created_at,
    updated_at: v.updated_at,
    default_value: v.default_value,
  }));
};

export const parsePromptJSONFile = (content: string): PromptJSONFileContent => {
  const parsedContent = JSON.parse(content);
  return PromptJSONFileContentSchema.parse(parsedContent);
};

export const parsePromptVersionJSONFile = (content: string): PromptVersionFileJSONContent => {
  const parsedContent = JSON.parse(content);
  return PromptVersionFileJSONContentSchema.parse(parsedContent);
};

export const parsePromptVariableJSONFile = (content: string): PromptVariableFileJSONContent => {
  const parsedContent = JSON.parse(content);
  return PromptVariableFileJSONContentSchema.parse(parsedContent);
};

export const isPromptFilePath = (path: string) => path.endsWith('/prompt.json');
export const isPromptVersionFilePath = (path: string) => path.endsWith('/version.json');
export const isPromptVariablesFilePath = (path: string) => path.endsWith('/variables.json');
export const isPromptContentFilePath = (path: string) => path.endsWith('/content.j2');
export const isGlobalsFilePath = (path: string) => path.endsWith('globals.json');
export const isAgentsmithTypesFilePath = (path: string) => path.endsWith('agentsmith.types.ts');
export const isChatPromptFilePath = (path: string) =>
  /\/(system_\d+|user_\d+|assistant_\d+|tool_\d+)\.j2$/.test(path);
