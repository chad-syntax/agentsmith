import { GetAllPromptsDataResult } from '../PromptsService';
import { GetProjectGlobalsByProjectIdResult } from '../ProjectsService';

export type AgentsmithState = {
  prompts: GetAllPromptsDataResult;
  globals: NonNullable<GetProjectGlobalsByProjectIdResult>;
};

export type RepoChatPrompt = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  index: number;
  sha: string;
  lastModified: string;
};

export type RepoVersion = {
  version: string;
  type: 'NON_CHAT' | 'CHAT';
  versionSha: string;
  contentSha: string | null;
  variablesSha: string | null;
  versionLastModified: string;
  contentLastModified: string | null;
  variablesLastModified: string | null;
  chatPrompts: RepoChatPrompt[] | null;
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

export type RepoAgentsmithTypes = {
  sha: string;
  lastModified: string;
};

export type RepoState = {
  prompts: RepoPrompt[];
  globals: RepoGlobals | null;
  agentsmithTypes: RepoAgentsmithTypes | null;
};
