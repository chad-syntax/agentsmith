import { GetAllPromptsDataResult } from '../PromptsService';
import { GetProjectGlobalsByProjectIdResult } from '../ProjectsService';

export type AgentsmithState = {
  prompts: GetAllPromptsDataResult;
  globals: NonNullable<GetProjectGlobalsByProjectIdResult>;
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

export type RepoGlobals = {
  sha: string;
  lastModified: string;
};

export type RepoState = {
  prompts: RepoPrompt[];
  globals: RepoGlobals | null;
};
