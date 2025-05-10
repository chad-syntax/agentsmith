import { Database } from '@/app/__generated__/supabase.types';
import { GetAllPromptsDataResult } from '../PromptsService';

export type AgentsmithCreatePromptAction = {
  target: 'agentsmith';
  type: 'create';
  entity: 'prompt';
  slug: string;
  sha: string;
};

export type AgentsmithUpdatePromptAction = {
  target: 'agentsmith';
  type: 'update';
  entity: 'prompt';
  slug: string;
  oldContent: string;
  oldSha: string | null;
  newSha: string;
};

export type AgentsmithCreateVersionAction = {
  target: 'agentsmith';
  type: 'create';
  entity: 'version';
  promptSlug: string;
  version: string;
  versionSha: string;
  contentSha: string;
  variablesSha: string | null;
};

export type AgentsmithUpdateVersionAction = {
  target: 'agentsmith';
  type: 'update';
  entity: 'version';
  promptSlug: string;
  version: string;
  oldContent: string;
  oldSha: string | null;
  newSha: string;
};

// type AgentsmithCreateVariablesAction = {
//   target: 'agentsmith';
//   type: 'create';
//   entity: 'variables';
//   promptSlug: string;
//   version: string;
//   sha: string;
// };

export type AgentsmithUpdateVariablesAction = {
  target: 'agentsmith';
  type: 'update';
  entity: 'variables';
  promptSlug: string;
  version: string;
  oldContent: string;
  oldSha: string | null;
  newSha: string;
};

export type AgentsmithDeleteVariablesAction = {
  target: 'agentsmith';
  type: 'delete';
  entity: 'variables';
  promptSlug: string;
  version: string;
};

export type AgentsmithUpdateContentAction = {
  target: 'agentsmith';
  type: 'update';
  entity: 'content';
  promptSlug: string;
  version: string;
  promptVersionUuid: string;
  oldContent: string;
  oldSha: string | null;
  newSha: string;
};

export type RepoCreatePromptAction = {
  target: 'repo';
  type: 'create';
  entity: 'prompt';
  prompt: GetAllPromptsDataResult[number];
};

export type RepoUpdatePromptAction = {
  target: 'repo';
  type: 'update';
  entity: 'prompt';
  prompt: GetAllPromptsDataResult[number];
};

// we may implement in the future, would reqire checking all prompt versions to see if they are archived
// type RepoDeletePromptAction = {
//   target: 'repo';
//   type: 'delete';
//   entity: 'prompt';
//   prompt: Database['public']['Tables']['prompts']['Row'];
// };

export type RepoCreateVersionAction = {
  target: 'repo';
  type: 'create';
  entity: 'version';
  promptSlug: string;
  promptVersion: GetAllPromptsDataResult[number]['prompt_versions'][number];
};

export type RepoUpdateVersionAction = {
  target: 'repo';
  type: 'update';
  entity: 'version';
  promptSlug: string;
  promptVersion: GetAllPromptsDataResult[number]['prompt_versions'][number];
};

export type RepoUpdateContentAction = {
  target: 'repo';
  type: 'update';
  entity: 'content';
  promptSlug: string;
  promptVersion: GetAllPromptsDataResult[number]['prompt_versions'][number];
};

export type RepoDeleteVersionAction = {
  target: 'repo';
  type: 'delete';
  entity: 'version';
  promptSlug: string;
  promptVersion: GetAllPromptsDataResult[number]['prompt_versions'][number];
};

export type RepoCreateVariablesAction = {
  target: 'repo';
  type: 'create';
  entity: 'variables';
  promptSlug: string;
  promptVersionUuid: string;
  version: string;
  promptVariables: GetAllPromptsDataResult[number]['prompt_versions'][number]['prompt_variables'];
};

export type RepoUpdateVariablesAction = {
  target: 'repo';
  type: 'update';
  entity: 'variables';
  promptSlug: string;
  promptVersionUuid: string;
  version: string;
  promptVariables: GetAllPromptsDataResult[number]['prompt_versions'][number]['prompt_variables'];
};

export type RepoDeleteVariablesAction = {
  target: 'repo';
  type: 'delete';
  entity: 'variables';
  promptSlug: string;
  promptVersionUuid: string;
  version: string;
};

export type RepoDeleteContentAction = {
  target: 'repo';
  type: 'delete';
  entity: 'content';
  promptSlug: string;
  version: string;
  promptVersionUuid: string;
};

export type SyncAction =
  | AgentsmithCreatePromptAction
  | AgentsmithUpdatePromptAction
  | AgentsmithCreateVersionAction
  | AgentsmithUpdateVersionAction
  // | AgentsmithCreateVariablesAction
  | AgentsmithUpdateVariablesAction
  | AgentsmithDeleteVariablesAction
  | AgentsmithUpdateContentAction
  | RepoCreatePromptAction
  | RepoUpdatePromptAction
  // | RepoDeletePromptAction
  | RepoCreateVersionAction
  | RepoUpdateVersionAction
  | RepoUpdateContentAction
  | RepoDeleteVersionAction
  | RepoCreateVariablesAction
  | RepoUpdateVariablesAction
  | RepoDeleteVariablesAction
  | RepoDeleteContentAction;

export const isAgentsmithCreatePromptAction = (
  action: SyncAction,
): action is AgentsmithCreatePromptAction => {
  return action.target === 'agentsmith' && action.entity === 'prompt' && action.type === 'create';
};

export const isAgentsmithUpdatePromptAction = (
  action: SyncAction,
): action is AgentsmithUpdatePromptAction => {
  return action.target === 'agentsmith' && action.entity === 'prompt' && action.type === 'update';
};

export const isAgentsmithCreateVersionAction = (
  action: SyncAction,
): action is AgentsmithCreateVersionAction => {
  return action.target === 'agentsmith' && action.entity === 'version' && action.type === 'create';
};

export const isAgentsmithUpdateVersionAction = (
  action: SyncAction,
): action is AgentsmithUpdateVersionAction => {
  return action.target === 'agentsmith' && action.entity === 'version' && action.type === 'update';
};

// export const isCreateVariablesAction = (action: SyncAction): action is AgentsmithCreateVariablesAction => {
//   return action.entity === 'variables' && action.type === 'create';
// }

export const isAgentsmithUpdateVariablesAction = (
  action: SyncAction,
): action is AgentsmithUpdateVariablesAction => {
  return (
    action.target === 'agentsmith' && action.entity === 'variables' && action.type === 'update'
  );
};

export const isAgentsmithUpdateContentAction = (
  action: SyncAction,
): action is AgentsmithUpdateContentAction => {
  return action.target === 'agentsmith' && action.entity === 'content' && action.type === 'update';
};

export const isRepoCreatePromptAction = (action: SyncAction): action is RepoCreatePromptAction => {
  return action.target === 'repo' && action.entity === 'prompt' && action.type === 'create';
};

export const isRepoUpdatePromptAction = (action: SyncAction): action is RepoUpdatePromptAction => {
  return action.target === 'repo' && action.entity === 'prompt' && action.type === 'update';
};

export const isRepoCreateVersionAction = (
  action: SyncAction,
): action is RepoCreateVersionAction => {
  return action.target === 'repo' && action.entity === 'version' && action.type === 'create';
};

export const isRepoUpdateVersionAction = (
  action: SyncAction,
): action is RepoUpdateVersionAction => {
  return action.target === 'repo' && action.entity === 'version' && action.type === 'update';
};

export const isRepoUpdateContentAction = (
  action: SyncAction,
): action is RepoUpdateContentAction => {
  return action.target === 'repo' && action.entity === 'content' && action.type === 'update';
};

export const isRepoDeleteVersionAction = (
  action: SyncAction,
): action is RepoDeleteVersionAction => {
  return action.target === 'repo' && action.entity === 'version' && action.type === 'delete';
};

export const isRepoCreateVariablesAction = (
  action: SyncAction,
): action is RepoCreateVariablesAction => {
  return action.target === 'repo' && action.entity === 'variables' && action.type === 'create';
};

export const isRepoUpdateVariablesAction = (
  action: SyncAction,
): action is RepoUpdateVariablesAction => {
  return action.target === 'repo' && action.entity === 'variables' && action.type === 'update';
};

export const isRepoDeleteVariablesAction = (
  action: SyncAction,
): action is RepoDeleteVariablesAction => {
  return action.target === 'repo' && action.entity === 'variables' && action.type === 'delete';
};

export const isRepoDeleteContentAction = (
  action: SyncAction,
): action is RepoDeleteContentAction => {
  return action.target === 'repo' && action.entity === 'content' && action.type === 'delete';
};
