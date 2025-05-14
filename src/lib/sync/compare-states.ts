import {
  AgentsmithCreatePromptAction,
  AgentsmithCreateVersionAction,
  AgentsmithDeleteVariablesAction,
  AgentsmithUpdateContentAction,
  AgentsmithUpdatePromptAction,
  AgentsmithUpdateVariablesAction,
  AgentsmithUpdateVersionAction,
  RepoCreateGlobalsAction,
  RepoCreatePromptAction,
  RepoCreateVariablesAction,
  RepoCreateVersionAction,
  RepoDeleteContentAction,
  RepoDeleteVariablesAction,
  RepoDeleteVersionAction,
  RepoUpdateContentAction,
  RepoUpdateGlobalsAction,
  RepoUpdatePromptAction,
  RepoUpdateVariablesAction,
  RepoUpdateVersionAction,
  SyncAction,
} from './sync-actions';
import { GetAllPromptsDataResult } from '../PromptsService';
import { AgentsmithState, RepoState, RepoPrompt, RepoVersion } from './sync-states';
import {
  generatePromptJsonContent,
  generatePromptVersionJsonContent,
  generatePromptVariablesJsonContent,
} from './repo-file-formats';

type CompareStatesOptions = {
  agentsmithState: AgentsmithState;
  repoState: RepoState;
};

export const compareStates = (options: CompareStatesOptions): SyncAction[] => {
  const { agentsmithState, repoState } = options;

  const actionPlan: SyncAction[] = [];

  const agentsmithPromptsMap = new Map<string, GetAllPromptsDataResult[number]>(
    agentsmithState.prompts.map((p) => [p.slug, p]),
  );

  const repoPromptsMap = new Map<string, RepoPrompt>(repoState.prompts.map((p) => [p.slug, p]));

  // if globals do not exist in repo, create in repo
  if (!repoState.globals) {
    const createGlobalsAction: RepoCreateGlobalsAction = {
      type: 'create',
      target: 'repo',
      entity: 'globals',
      globals: agentsmithState.globals,
    };

    actionPlan.push(createGlobalsAction);
  }

  // if globals exist in repo, but have a different sha, and are newer than the agentsmith globals, update in repo
  if (
    repoState.globals &&
    repoState.globals.sha !== agentsmithState.globals.last_sync_git_sha &&
    repoState.globals.lastModified < agentsmithState.globals.updated_at
  ) {
    const updateGlobalsAction: RepoUpdateGlobalsAction = {
      type: 'update',
      target: 'repo',
      entity: 'globals',
      globals: agentsmithState.globals,
    };

    actionPlan.push(updateGlobalsAction);
  }

  // loop through each prompt in agentsmith state
  for (const agentsmithPrompt of agentsmithState.prompts) {
    const targetRepoPrompt = repoPromptsMap.get(agentsmithPrompt.slug);
    const targetRepoVersionsMap = new Map<string, RepoVersion>(
      targetRepoPrompt?.versions.map((v) => [v.version, v]) || [],
    );

    // prompt exists in agentsmith, but not in repo, create in repo
    if (!targetRepoPrompt) {
      const createPromptAction: RepoCreatePromptAction = {
        type: 'create',
        target: 'repo',
        entity: 'prompt',
        prompt: agentsmithPrompt,
      };

      actionPlan.push(createPromptAction);
    }

    // prompt exists in agentsmith and repo, but has a different sha, and is newer than the repo version, update in repo
    if (
      targetRepoPrompt &&
      targetRepoPrompt.sha !== agentsmithPrompt.last_sync_git_sha &&
      targetRepoPrompt.lastModified < agentsmithPrompt.updated_at
    ) {
      const updatePromptAction: RepoUpdatePromptAction = {
        type: 'update',
        target: 'repo',
        entity: 'prompt',
        prompt: agentsmithPrompt,
      };

      actionPlan.push(updatePromptAction);
    }

    for (const agentsmithVersion of agentsmithPrompt.prompt_versions) {
      const targetRepoVersion = targetRepoVersionsMap.get(agentsmithVersion.version);

      // version exists in agentsmith, but not in repo, create in repo
      if (!targetRepoVersion) {
        const createVersionAction: RepoCreateVersionAction = {
          type: 'create',
          target: 'repo',
          promptSlug: agentsmithPrompt.slug,
          entity: 'version',
          promptVersion: agentsmithVersion,
        };

        actionPlan.push(createVersionAction);
      }

      // version exists in agentsmith and repo, but has a different sha, and is newer than the repo version, update in repo
      if (
        targetRepoVersion &&
        targetRepoVersion.versionSha !== agentsmithVersion.last_sync_git_sha &&
        targetRepoVersion.versionLastModified < agentsmithVersion.updated_at
      ) {
        const updateVersionAction: RepoUpdateVersionAction = {
          type: 'update',
          target: 'repo',
          promptSlug: agentsmithPrompt.slug,
          entity: 'version',
          promptVersion: agentsmithVersion,
        };

        actionPlan.push(updateVersionAction);
      }

      // variables exist in agentsmith and repo, but has a different sha, and is newer than the repo version, update in repo
      if (
        targetRepoVersion &&
        targetRepoVersion.variablesSha !== agentsmithVersion.last_sync_variables_sha &&
        (targetRepoVersion.variablesLastModified ?? 0) < agentsmithVersion.updated_at
      ) {
        const updateVariablesAction: RepoUpdateVariablesAction = {
          type: 'update',
          target: 'repo',
          entity: 'variables',
          promptSlug: agentsmithPrompt.slug,
          version: agentsmithVersion.version,
          promptVariables: agentsmithVersion.prompt_variables,
          promptVersionUuid: agentsmithVersion.uuid,
        };

        actionPlan.push(updateVariablesAction);
      }

      // variables exist in agentsmith, but not in repo, and the version in agentsmith is newer, create in repo
      if (
        targetRepoVersion &&
        targetRepoVersion.variablesSha === null &&
        agentsmithVersion.prompt_variables.length > 0 &&
        agentsmithVersion.updated_at > (targetRepoVersion.versionLastModified ?? 0)
      ) {
        const createVariablesAction: RepoCreateVariablesAction = {
          type: 'create',
          target: 'repo',
          entity: 'variables',
          promptSlug: agentsmithPrompt.slug,
          version: agentsmithVersion.version,
          promptVersionUuid: agentsmithVersion.uuid,
          promptVariables: agentsmithVersion.prompt_variables,
        };

        actionPlan.push(createVariablesAction);
      }

      // content exists in agentsmith and repo, but has a different sha, and is newer than the repo version, update in repo
      if (
        targetRepoVersion &&
        targetRepoVersion.contentSha !== agentsmithVersion.last_sync_content_sha &&
        targetRepoVersion.contentLastModified < agentsmithVersion.updated_at
      ) {
        const updateContentAction: RepoUpdateContentAction = {
          type: 'update',
          target: 'repo',
          entity: 'content',
          promptSlug: agentsmithPrompt.slug,
          promptVersion: agentsmithVersion,
        };

        actionPlan.push(updateContentAction);
      }

      // version exists in agentsmith and repo, but is archived, delete in repo
      if (agentsmithVersion.status === 'ARCHIVED' && targetRepoVersion) {
        const deleteVersionAction: RepoDeleteVersionAction = {
          type: 'delete',
          target: 'repo',
          promptSlug: agentsmithPrompt.slug,
          entity: 'version',
          promptVersion: agentsmithVersion,
        };

        // issue delete for version
        actionPlan.push(deleteVersionAction);

        const deleteVariablesAction: RepoDeleteVariablesAction = {
          type: 'delete',
          target: 'repo',
          entity: 'variables',
          promptSlug: agentsmithPrompt.slug,
          version: agentsmithVersion.version,
          promptVersionUuid: agentsmithVersion.uuid,
        };

        // issue delete for variables
        actionPlan.push(deleteVariablesAction);

        const deleteContentAction: RepoDeleteContentAction = {
          type: 'delete',
          target: 'repo',
          entity: 'content',
          promptSlug: agentsmithPrompt.slug,
          version: agentsmithVersion.version,
          promptVersionUuid: agentsmithVersion.uuid,
        };

        // issue delete for content
        actionPlan.push(deleteContentAction);
      }
    }
  }

  // loop through repo prompts and create in agentsmith (if not found)
  for (const repoPrompt of repoState.prompts) {
    const agentsmithPrompt = agentsmithPromptsMap.get(repoPrompt.slug);
    const agentsmithVersionsMap = new Map<
      string,
      GetAllPromptsDataResult[number]['prompt_versions'][number]
    >(agentsmithPrompt?.prompt_versions.map((v) => [v.version, v]) ?? []);

    // prompt exists in repo, but not in agentsmith, create in agentsmith
    if (!agentsmithPrompt) {
      const createPromptAction: AgentsmithCreatePromptAction = {
        type: 'create',
        target: 'agentsmith',
        entity: 'prompt',
        slug: repoPrompt.slug,
        sha: repoPrompt.sha,
      };

      actionPlan.push(createPromptAction);
    }

    // prompt exists in agentsmith and repo, but has a different sha, and is newer than the agentsmith version, issue update
    if (
      agentsmithPrompt &&
      agentsmithPrompt.last_sync_git_sha !== repoPrompt.sha &&
      agentsmithPrompt.updated_at < repoPrompt.lastModified
    ) {
      const oldContent = JSON.stringify(generatePromptJsonContent(agentsmithPrompt), null, 2);

      const updatePromptAction: AgentsmithUpdatePromptAction = {
        type: 'update',
        target: 'agentsmith',
        entity: 'prompt',
        slug: repoPrompt.slug,
        newSha: repoPrompt.sha,
        oldSha: agentsmithPrompt.last_sync_git_sha,
        oldContent,
      };

      actionPlan.push(updatePromptAction);
    }

    // loop through repo versions and create in agentsmith (if not found)
    for (const repoPromptVersion of repoPrompt.versions) {
      const targetAgentsmithVersion = agentsmithVersionsMap.get(repoPromptVersion.version);

      // version exists in repo, but not in agentsmith, create in agentsmith
      if (!targetAgentsmithVersion) {
        const createVersionAction: AgentsmithCreateVersionAction = {
          type: 'create',
          target: 'agentsmith',
          promptSlug: repoPrompt.slug,
          entity: 'version',
          version: repoPromptVersion.version,
          versionSha: repoPromptVersion.versionSha,
          contentSha: repoPromptVersion.contentSha,
          variablesSha: repoPromptVersion.variablesSha,
        };

        actionPlan.push(createVersionAction);
      }

      // version exists in repo and agentsmith, but has a different sha, and is newer than the agentsmith version, issue update
      if (
        targetAgentsmithVersion &&
        targetAgentsmithVersion.last_sync_git_sha !== repoPromptVersion.versionSha &&
        targetAgentsmithVersion.updated_at < repoPromptVersion.versionLastModified
      ) {
        const oldContent = JSON.stringify(
          generatePromptVersionJsonContent(targetAgentsmithVersion),
          null,
          2,
        );

        const updateVersionAction: AgentsmithUpdateVersionAction = {
          type: 'update',
          target: 'agentsmith',
          entity: 'version',
          promptSlug: repoPrompt.slug,
          version: repoPromptVersion.version,
          oldContent,
          oldSha: targetAgentsmithVersion.last_sync_git_sha,
          newSha: repoPromptVersion.versionSha,
        };

        actionPlan.push(updateVersionAction);
      }

      const versionHasVariables = (targetAgentsmithVersion?.prompt_variables.length ?? 0) > 0;

      const mostRecentVariablesUpdatedAt =
        targetAgentsmithVersion?.prompt_variables.reduce(
          (acc, v) => (v.updated_at > acc ? v.updated_at : acc),
          targetAgentsmithVersion?.prompt_variables?.[0]?.updated_at ?? new Date(0).toISOString(),
        ) ??
        // we go by the version updated_at in the case that agentsmith has no variables, but repo does
        targetAgentsmithVersion?.updated_at ??
        new Date(0).toISOString();

      // if version exists in agentsmith and repo, and repo has variables, but has a different variables sha, and is newer than the agentsmith version, issue variables update
      if (
        targetAgentsmithVersion &&
        repoPromptVersion.variablesSha &&
        targetAgentsmithVersion.last_sync_variables_sha !== repoPromptVersion.variablesSha &&
        mostRecentVariablesUpdatedAt < (repoPromptVersion.variablesLastModified ?? 0)
      ) {
        const oldContent = JSON.stringify(
          generatePromptVariablesJsonContent(targetAgentsmithVersion.prompt_variables),
          null,
          2,
        );

        const updateVariablesAction: AgentsmithUpdateVariablesAction = {
          type: 'update',
          target: 'agentsmith',
          entity: 'variables',
          promptSlug: repoPrompt.slug,
          version: repoPromptVersion.version,
          oldContent,
          oldSha: targetAgentsmithVersion.last_sync_variables_sha,
          newSha: repoPromptVersion.variablesSha,
        };

        actionPlan.push(updateVariablesAction);
      }

      // if version exists in agentsmith and repo, and repo does not have variables, and agentsmith status is DRAFT, and repo content is newer than agentsmith variables, issue variables delete
      if (
        targetAgentsmithVersion &&
        repoPromptVersion.variablesSha === null &&
        targetAgentsmithVersion.last_sync_variables_sha !== null &&
        versionHasVariables &&
        repoPromptVersion.contentLastModified > mostRecentVariablesUpdatedAt &&
        targetAgentsmithVersion.status === 'DRAFT' // we do not delete variables for published versions
      ) {
        const deleteVariablesAction: AgentsmithDeleteVariablesAction = {
          type: 'delete',
          target: 'agentsmith',
          entity: 'variables',
          promptSlug: repoPrompt.slug,
          version: repoPromptVersion.version,
        };

        actionPlan.push(deleteVariablesAction);
      }

      // if version exists in agentsmith and repo, but has a different content sha, and is newer than the agentsmith version, issue content update
      if (
        targetAgentsmithVersion &&
        targetAgentsmithVersion.last_sync_content_sha !== repoPromptVersion.contentSha &&
        targetAgentsmithVersion.updated_at < repoPromptVersion.contentLastModified
      ) {
        const oldContent = targetAgentsmithVersion.content;

        const updateContentAction: AgentsmithUpdateContentAction = {
          type: 'update',
          target: 'agentsmith',
          entity: 'content',
          promptSlug: repoPrompt.slug,
          version: repoPromptVersion.version,
          promptVersionUuid: targetAgentsmithVersion.uuid,
          oldContent,
          oldSha: targetAgentsmithVersion.last_sync_content_sha,
          newSha: repoPromptVersion.contentSha,
        };

        actionPlan.push(updateContentAction);
      }
    }
  }

  return actionPlan;
};
