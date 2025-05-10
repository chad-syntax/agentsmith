import { GetAllPromptsDataResult } from '../PromptsService';

export type AgentsmithState = {
  prompts: GetAllPromptsDataResult;
};

export type RepoVersion = {
  version: string;
  versionSha: string;
  contentSha: string;
  variablesSha: string | null;
  versionLastModified: string;
  contentLastModified: string;
  variablesLastModified: string | null;
};

export type RepoPrompt = {
  sha: string;
  slug: string;
  versions: RepoVersion[];
  lastModified: string;
};

export type RepoState = {
  prompts: RepoPrompt[];
};
