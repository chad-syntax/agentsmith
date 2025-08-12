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
  RepoCreateAgentsmithTypesAction,
  SyncAction,
  RepoUpdateAgentsmithTypesAction,
  RepoCreateChatPromptAction,
  RepoDeleteChatPromptAction,
  RepoUpdateChatPromptAction,
  AgentsmithCreateChatPromptAction,
  AgentsmithDeleteChatPromptAction,
  AgentsmithUpdateChatPromptAction,
} from './sync-actions';
import { GetAllPromptsDataResult } from '../PromptsService';
import { AgentsmithState, RepoState, RepoPrompt, RepoVersion, RepoChatPrompt } from './sync-states';
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
      // and the version type is NON_CHAT
      if (
        targetRepoVersion &&
        targetRepoVersion.contentSha !== agentsmithVersion.last_sync_content_sha &&
        targetRepoVersion.contentLastModified &&
        targetRepoVersion.contentLastModified < agentsmithVersion.updated_at &&
        agentsmithVersion.type === 'NON_CHAT'
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

      // if the version type is CHAT, we need to iterate over the chat prompts and create/update/delete in repo
      if (targetRepoVersion && agentsmithVersion.type === 'CHAT') {
        const repoChatPromptsMap = new Map<string, RepoChatPrompt>(
          targetRepoVersion.chatPrompts?.map((cp) => [`${cp.role}_${cp.index}`, cp]) || [],
        );

        // loop through each chat prompt in agentsmith version
        for (const agentsmithChatPrompt of agentsmithVersion.pv_chat_prompts) {
          const targetRepoChatPrompt = repoChatPromptsMap.get(
            `${agentsmithChatPrompt.role}_${agentsmithChatPrompt.index}`,
          );

          // if the chat prompt exists in agentsmith, but not in repo, create in repo
          if (!targetRepoChatPrompt) {
            const createChatPromptAction: RepoCreateChatPromptAction = {
              type: 'create',
              target: 'repo',
              entity: 'chatPrompt',
              promptVersionUuid: agentsmithVersion.uuid,
              promptSlug: agentsmithPrompt.slug,
              version: agentsmithVersion.version,
              pvChatPrompt: agentsmithChatPrompt,
            };

            actionPlan.push(createChatPromptAction);
          }

          // if the chat prompt exists in both agentsmith and repo, but has a different sha, and is newer than the repo version, update in repo
          if (
            targetRepoChatPrompt &&
            targetRepoChatPrompt.sha !== agentsmithChatPrompt.last_sync_git_sha &&
            targetRepoChatPrompt.lastModified < agentsmithChatPrompt.updated_at
          ) {
            const updateChatPromptAction: RepoUpdateChatPromptAction = {
              type: 'update',
              target: 'repo',
              entity: 'chatPrompt',
              promptVersionUuid: agentsmithVersion.uuid,
              promptSlug: agentsmithPrompt.slug,
              version: agentsmithVersion.version,
              pvChatPrompt: agentsmithChatPrompt,
            };

            actionPlan.push(updateChatPromptAction);
          }
        }
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
        repoPromptVersion.contentLastModified &&
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
        repoPromptVersion.contentLastModified &&
        targetAgentsmithVersion.updated_at < repoPromptVersion.contentLastModified &&
        targetAgentsmithVersion.content !== null &&
        repoPromptVersion.contentSha !== null &&
        repoPromptVersion.type === 'NON_CHAT'
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

      // if the version type is CHAT, we need to iterate over the chat prompts and create/update/delete in agentsmith
      if (
        targetAgentsmithVersion &&
        repoPromptVersion.type === 'CHAT' &&
        repoPromptVersion.chatPrompts &&
        repoPromptVersion.chatPrompts.length > 0
      ) {
        const agentsmithChatPromptsMap = new Map<
          string,
          GetAllPromptsDataResult[number]['prompt_versions'][number]['pv_chat_prompts'][number]
        >(targetAgentsmithVersion.pv_chat_prompts.map((cp) => [`${cp.role}_${cp.index}`, cp]));

        for (const repoChatPrompt of repoPromptVersion.chatPrompts) {
          const targetAgentsmithChatPrompt = agentsmithChatPromptsMap.get(
            `${repoChatPrompt.role}_${repoChatPrompt.index}`,
          );

          // if the chat prompt exists in repo but not agentsmith,
          // and the repo chat prompt last modified is newer than the targetAgentsmithVersion updated_at, create in agentsmith
          if (
            !targetAgentsmithChatPrompt &&
            repoChatPrompt.lastModified > (targetAgentsmithVersion.updated_at ?? 0)
          ) {
            const createChatPromptAction: AgentsmithCreateChatPromptAction = {
              type: 'create',
              target: 'agentsmith',
              entity: 'chatPrompt',
              promptSlug: repoPrompt.slug,
              version: repoPromptVersion.version,
              promptVersionUuid: targetAgentsmithVersion.uuid,
              role: repoChatPrompt.role,
              index: repoChatPrompt.index,
              sha: repoChatPrompt.sha,
            };

            actionPlan.push(createChatPromptAction);
          }

          // if the chat prompt exists in repo but not in agentsmith,
          // and the repo chat prompt last modified is older than the targetAgentsmithVersion updated_at, delete in repo
          if (
            !targetAgentsmithChatPrompt &&
            repoChatPrompt.lastModified < (targetAgentsmithVersion.updated_at ?? 0)
          ) {
            const deleteChatPromptAction: RepoDeleteChatPromptAction = {
              type: 'delete',
              target: 'repo',
              entity: 'chatPrompt',
              promptSlug: repoPrompt.slug,
              version: repoPromptVersion.version,
              promptVersionUuid: targetAgentsmithVersion.uuid,
              role: repoChatPrompt.role,
              index: repoChatPrompt.index,
            };

            actionPlan.push(deleteChatPromptAction);
          }

          // if the chat prompt exists in both agentsmith and repo, but has a different sha, and is newer than the agentsmith version, issue update
          if (
            targetAgentsmithChatPrompt &&
            targetAgentsmithChatPrompt.last_sync_git_sha !== repoChatPrompt.sha &&
            targetAgentsmithChatPrompt.updated_at < repoChatPrompt.lastModified
          ) {
            const updateChatPromptAction: AgentsmithUpdateChatPromptAction = {
              type: 'update',
              target: 'agentsmith',
              entity: 'chatPrompt',
              promptSlug: repoPrompt.slug,
              version: repoPromptVersion.version,
              promptVersionUuid: targetAgentsmithVersion.uuid,
              role: repoChatPrompt.role,
              index: repoChatPrompt.index,
              oldContent: targetAgentsmithChatPrompt.content,
              oldSha: targetAgentsmithChatPrompt.last_sync_git_sha,
              newSha: repoChatPrompt.sha,
            };

            actionPlan.push(updateChatPromptAction);
          }
        }
      }
    }
  }

  // if agentsmith types do not exist in repo, create in repo
  if (!repoState.agentsmithTypes) {
    const createAgentsmithTypesAction: RepoCreateAgentsmithTypesAction = {
      type: 'create',
      target: 'repo',
      entity: 'agentsmithTypes',
    };

    actionPlan.push(createAgentsmithTypesAction);
  }

  const hasRepoActions = actionPlan.some((action) => action.target === 'repo');

  if (repoState.agentsmithTypes && hasRepoActions) {
    const updateAgentsmithTypesAction: RepoUpdateAgentsmithTypesAction = {
      type: 'update',
      target: 'repo',
      entity: 'agentsmithTypes',
    };

    actionPlan.push(updateAgentsmithTypesAction);
  }

  return actionPlan;
};
