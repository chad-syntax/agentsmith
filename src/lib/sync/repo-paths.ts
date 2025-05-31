export const promptJsonFilePath = (options: { agentsmithFolder: string; promptSlug: string }) =>
  `${options.agentsmithFolder}/prompts/${options.promptSlug}/prompt.json`;

export const versionJsonFilePath = (options: {
  agentsmithFolder: string;
  promptSlug: string;
  version: string;
}) => `${options.agentsmithFolder}/prompts/${options.promptSlug}/${options.version}/version.json`;

export const variablesJsonFilePath = (options: {
  agentsmithFolder: string;
  promptSlug: string;
  version: string;
}) => `${options.agentsmithFolder}/prompts/${options.promptSlug}/${options.version}/variables.json`;

export const contentJ2FilePath = (options: {
  agentsmithFolder: string;
  promptSlug: string;
  version: string;
}) => `${options.agentsmithFolder}/prompts/${options.promptSlug}/${options.version}/content.j2`;

export const globalsJsonFilePath = (options: { agentsmithFolder: string }) =>
  `${options.agentsmithFolder}/globals.json`;

export const agentsmithTypesTsFilePath = (options: { agentsmithFolder: string }) =>
  `${options.agentsmithFolder}/agentsmith.types.ts`;
