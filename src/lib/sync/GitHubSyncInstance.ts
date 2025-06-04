import { Octokit } from '@octokit/core';
import { AgentsmithSupabaseService } from '../AgentsmithSupabaseService';
import { SupabaseClient } from '@supabase/supabase-js';
import { components } from '@octokit/openapi-types';
import {
  promptJsonFilePath,
  versionJsonFilePath,
  variablesJsonFilePath,
  contentJ2FilePath,
  globalsJsonFilePath,
  agentsmithTypesTsFilePath,
} from './repo-paths';
import { AgentsmithState, RepoState, RepoPrompt, RepoVersion } from './sync-states';
import { compareStates } from './compare-states';
import {
  AgentsmithCreatePromptAction,
  AgentsmithCreateVersionAction,
  AgentsmithUpdatePromptAction,
  AgentsmithUpdateVersionAction,
  AgentsmithUpdateVariablesAction,
  AgentsmithUpdateContentAction,
  isAgentsmithCreatePromptAction,
  isAgentsmithCreateVersionAction,
  isAgentsmithUpdateContentAction,
  isAgentsmithUpdatePromptAction,
  isAgentsmithUpdateVariablesAction,
  isAgentsmithUpdateVersionAction,
  isRepoCreatePromptAction,
  isRepoCreateVariablesAction,
  isRepoCreateVersionAction,
  isRepoDeleteVariablesAction,
  isRepoDeleteVersionAction,
  isRepoUpdatePromptAction,
  isRepoUpdateVariablesAction,
  isRepoUpdateVersionAction,
  SyncAction,
  isRepoUpdateContentAction,
  RepoCreatePromptAction,
  RepoUpdatePromptAction,
  RepoUpdateVersionAction,
  RepoCreateVersionAction,
  RepoUpdateContentAction,
  RepoDeleteVariablesAction,
  RepoUpdateVariablesAction,
  RepoCreateVariablesAction,
  RepoDeleteVersionAction,
  isRepoDeleteContentAction,
  RepoDeleteContentAction,
  isRepoUpdateGlobalsAction,
  isRepoCreateGlobalsAction,
  RepoCreateGlobalsAction,
  RepoUpdateGlobalsAction,
  isRepoCreateAgentsmithTypesAction,
  isRepoUpdateAgentsmithTypesAction,
  RepoCreateAgentsmithTypesAction,
  RepoUpdateAgentsmithTypesAction,
} from './sync-actions';
import {
  generatePromptJsonContent,
  generatePromptVariablesJsonContent,
  generatePromptVersionJsonContent,
  parsePromptJSONFile,
  parsePromptVariableJSONFile,
  parsePromptVersionJSONFile,
  PromptJSONFileContent,
} from './repo-file-formats';
import { Database } from '@/app/__generated__/supabase.types';
import { base64Encode } from '@/utils/base64';
import { validateTemplate } from '@/utils/template-utils';

type SyncChangeTarget = 'agentsmith' | 'repo';
type SyncChangeType = 'create' | 'update' | 'delete';
type SyncChangeEntity = 'prompt' | 'version' | 'variables' | 'content';

export type SyncChange =
  | {
      target: SyncChangeTarget;
      type: SyncChangeType;
      entity: SyncChangeEntity;
      promptSlug: string;
      promptVersion: string | null;
      oldContent: string | null;
      newContent: string | null;
      oldSha: string | null;
      newSha: string | null;
    }
  | {
      target: 'repo';
      type: SyncChangeType;
      entity: 'globals';
      oldContent: string | null;
      newContent: string | null;
      oldSha: string | null;
      newSha: string | null;
    }
  | {
      target: 'repo';
      type: SyncChangeType;
      entity: 'agentsmithTypes';
      oldContent: string | null;
      newContent: string | null;
      oldSha: string | null;
      newSha: string | null;
    };

type HardenedGitTreeEntry = {
  [P in keyof components['schemas']['git-tree']['tree'][number]]-?: NonNullable<
    components['schemas']['git-tree']['tree'][number][P]
  >;
} & {
  lastModified: string;
};

type CreateRepoFileOptions = {
  path: string;
  content: string;
  message: string;
};

type UpdateRepoFileOptions = {
  path: string;
  content: string;
  message: string;
  sha: string;
};

type DeleteRepoFileOptions = {
  path: string;
  entity: SyncChangeEntity;
  sha: string;
};

type GitHubSyncInstanceOptions = {
  supabase: SupabaseClient;
  octokit: Octokit;
  owner: string;
  repo: string;
  branchRef: string;
  defaultBranch: string;
  agentsmithFolder: string;
  projectId: number;
};

export class GitHubSyncInstance extends AgentsmithSupabaseService {
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;
  private readonly branchRef: string;
  private readonly agentsmithFolder: string;
  private readonly projectId: number;
  private readonly isMainBranch: boolean;

  constructor(options: GitHubSyncInstanceOptions) {
    super({ serviceName: 'githubSyncInstance', supabase: options.supabase });

    this.octokit = options.octokit;
    this.owner = options.owner;
    this.repo = options.repo;
    this.branchRef = options.branchRef;
    this.agentsmithFolder = options.agentsmithFolder;
    this.projectId = options.projectId;
    this.isMainBranch = options.defaultBranch === this.branchRef;
  }

  public async getAgentsmithState(): Promise<AgentsmithState> {
    const [promptsData, projectGlobals] = await Promise.all([
      this.services.prompts.getAllPromptsData(this.projectId),
      this.services.projects.getProjectGlobalsByProjectId(this.projectId),
    ]);

    if (!promptsData) {
      throw new Error(`Failed to fetch prompts for project ${this.projectId}`);
    }

    if (!projectGlobals) {
      throw new Error(`No project globals found for project ${this.projectId}`);
    }

    return {
      prompts: promptsData,
      globals: projectGlobals,
    };
  }

  public async getRepoState(): Promise<RepoState | null> {
    const agentsmithFolderContents = await this.getRepoFolderContents();

    if (!agentsmithFolderContents) {
      this.logger.info('Agentsmith folder contents not found, returning empty repo state');
      return {
        prompts: [],
        globals: null,
        agentsmithTypes: null,
      };
    }

    // since we are listing contents based on the agentsmithFolder, the data is returned without the agentsmith folder prefix
    // so we need to prepend it to the path
    const folderContentsWithAgentsmithFolder = agentsmithFolderContents.map((file) => ({
      ...file,
      path: `${this.agentsmithFolder}/${file.path}`,
    }));

    const fileMap = new Map<string, HardenedGitTreeEntry>(
      folderContentsWithAgentsmithFolder.map((file) => [file.path, file]),
    );

    try {
      const promptFiles = folderContentsWithAgentsmithFolder.filter((file) =>
        file.path.endsWith('/prompt.json'),
      );

      const globalsFile =
        folderContentsWithAgentsmithFolder.find((file) => file.path.endsWith('/globals.json')) ??
        null;

      const agentsmithTypesFile =
        folderContentsWithAgentsmithFolder.find((file) =>
          file.path.endsWith('/agentsmith.types.ts'),
        ) ?? null;

      const repoPrompts: RepoPrompt[] = [];

      for (const promptFile of promptFiles) {
        const promptSlug = promptFile.path.split('/')[2];

        if (!promptSlug) {
          this.logger.warn(`Failed to find slug for prompt file: ${promptFile.path}`);
          continue;
        }

        const allPromptVersionNumbers = folderContentsWithAgentsmithFolder
          .filter((file) => {
            const isPromptVersion = file.path.split('/')[2] === promptSlug;
            const isVersionFile = file.path.endsWith('/version.json');
            return isPromptVersion && isVersionFile;
          })
          .map((file) => file.path.split('/')[3]);

        const repoVersions: RepoVersion[] = [];

        for (const versionNumber of allPromptVersionNumbers) {
          const fileOptions = {
            agentsmithFolder: this.agentsmithFolder,
            promptSlug,
            version: versionNumber,
          };

          const versionFilePath = versionJsonFilePath(fileOptions);
          const variablesFilePath = variablesJsonFilePath(fileOptions);
          const contentFilePath = contentJ2FilePath(fileOptions);

          const versionFile = fileMap.get(versionFilePath);
          const variablesFile = fileMap.get(variablesFilePath);
          const contentFile = fileMap.get(contentFilePath);

          if (!versionFile) {
            this.logger.warn(
              `version file not found for ${promptSlug} v${versionNumber}, cannot add to state, looked for ${versionFilePath}`,
            );
            continue;
          }

          if (!contentFile) {
            this.logger.warn(
              `content file not found for ${promptSlug} v${versionNumber}, cannot add to state, looked for ${contentFilePath}`,
            );
            continue;
          }

          repoVersions.push({
            version: versionNumber,
            versionSha: versionFile.sha,
            versionLastModified: versionFile.lastModified,
            variablesSha: variablesFile ? variablesFile.sha : null,
            variablesLastModified: variablesFile ? variablesFile.lastModified : null,
            contentSha: contentFile.sha,
            contentLastModified: contentFile.lastModified,
          });
        }

        repoPrompts.push({
          slug: promptSlug,
          sha: promptFile.sha,
          versions: repoVersions,
          lastModified: promptFile.lastModified,
        });
      }

      const globals = globalsFile
        ? {
            sha: globalsFile.sha,
            lastModified: globalsFile.lastModified,
          }
        : null;

      const agentsmithTypes = agentsmithTypesFile
        ? {
            sha: agentsmithTypesFile.sha,
            lastModified: agentsmithTypesFile.lastModified,
          }
        : null;

      return {
        prompts: repoPrompts,
        globals,
        agentsmithTypes,
      };
    } catch (error) {
      this.logger.error('Error fetching repo state:', error);
      return null;
    }
  }

  public async executeSync(): Promise<SyncChange[]> {
    const [agentsmithState, repoState] = await Promise.all([
      this.getAgentsmithState(),
      this.getRepoState(),
    ]);

    if (!agentsmithState || !repoState) {
      throw new Error('Failed to fetch agentsmith or repo state');
    }

    const actions = compareStates({ agentsmithState, repoState });

    // for debugging purposes
    // const reportDir = `reports/${Date.now()}`;

    // await fs.promises.mkdir(reportDir, { recursive: true });

    // await fs.promises.writeFile(
    //   path.join(reportDir, 'agentsmith-state.json'),
    //   JSON.stringify(agentsmithState, null, 2),
    // );

    // await fs.promises.writeFile(
    //   path.join(reportDir, 'repo-state.json'),
    //   JSON.stringify(repoState, null, 2),
    // );

    // await fs.promises.writeFile(
    //   path.join(reportDir, 'actions.json'),
    //   JSON.stringify(actions, null, 2),
    // );

    const numRepoActions = actions.filter((action) => action.target === 'repo').length;
    const numAgentsmithActions = actions.filter((action) => action.target === 'agentsmith').length;

    this.logger.info(
      `executing ${actions.length} actions, ${numRepoActions} repo actions, ${numAgentsmithActions} agentsmith actions`,
    );

    const syncChanges = await this.executeActions(actions);

    // for debugging purposes
    // await fs.promises.writeFile(
    //   path.join(reportDir, 'sync-changes.json'),
    //   JSON.stringify(syncChanges, null, 2),
    // );

    return syncChanges;
  }

  private async getRepoFolderContents(): Promise<HardenedGitTreeEntry[] | null> {
    const { data: rootContentsData } = await this.octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner: this.owner,
        repo: this.repo,
        path: '',
        ref: this.branchRef,
      },
    );

    if (!Array.isArray(rootContentsData)) {
      this.logger.error(
        `Unexpected response format when fetching root contents for ${this.owner}/${this.repo}/${this.branchRef}. Expected an array.`,
      );
      throw new Error('Failed to fetch repository root contents.');
    }

    const agentsmithFolderEntry = rootContentsData.find(
      (item) => item.type === 'dir' && item.name === this.agentsmithFolder,
    );

    if (!agentsmithFolderEntry || !agentsmithFolderEntry.sha) {
      this.logger.warn(
        `agentsmithFolder '${this.agentsmithFolder}' not found or is not a directory in ${this.owner}/${this.repo}/${this.branchRef}. Returning null.`,
      );
      return null;
    }

    // 2. Get the tree for the agentsmithFolder recursively
    const { data: treeData } = await this.octokit.request(
      'GET /repos/{owner}/{repo}/git/trees/{tree_sha}',
      {
        owner: this.owner,
        repo: this.repo,
        tree_sha: agentsmithFolderEntry.sha, // Use the folder's SHA
        recursive: '1', // Fetch recursively within this folder
      },
    );

    if (!treeData || !Array.isArray(treeData.tree)) {
      this.logger.warn(
        `No tree entries found for agentsmithFolder '${this.agentsmithFolder}' (sha: ${agentsmithFolderEntry.sha}) in ${this.owner}/${this.repo}/${this.branchRef}. Returning empty repo state.`,
      );
      return null;
    }

    const relevantFiles = treeData.tree.filter(
      (item) =>
        item.type === 'blob' && // Ensure it's a file
        item.path !== undefined &&
        item.sha !== undefined &&
        item.url !== undefined &&
        item.size !== undefined &&
        (item.path.endsWith('/prompt.json') ||
          item.path.endsWith('/version.json') ||
          item.path.endsWith('/variables.json') ||
          item.path.endsWith('/content.j2') ||
          item.path.endsWith('globals.json') ||
          item.path.endsWith('agentsmith.types.ts')),
    );

    // Assert that the filtered files match this hardened type
    const hardenedRelevantFiles = relevantFiles as HardenedGitTreeEntry[];

    if (hardenedRelevantFiles.length === 0) {
      return [];
    }

    const filesWithLastModifiedPromises = hardenedRelevantFiles.map(async (hardenedFile) => {
      const fullPath = `${this.agentsmithFolder}/${hardenedFile.path}`; // hardenedFile.path is relative to agentsmithFolder

      const dateZero = new Date(0).toISOString();

      try {
        const commitsResponse = await this.octokit.request('GET /repos/{owner}/{repo}/commits', {
          owner: this.owner,
          repo: this.repo,
          path: fullPath,
          sha: this.branchRef, // 'ref' is the branch/commit SHA passed to _getRepoFolderContents
          per_page: 1,
        });

        let lastModified: string = dateZero;
        // Check if commit data is available
        if (commitsResponse.data.length > 0 && commitsResponse.data[0].commit) {
          const commitInfo = commitsResponse.data[0].commit;
          // Prefer committer date, fallback to author date
          lastModified = commitInfo.committer?.date || commitInfo.author?.date || dateZero;
          if (!lastModified) {
            this.logger.warn(
              `Commit found for ${fullPath} on ref ${this.branchRef}, but no committer or author date was available.`,
            );
          }
        } else {
          // This case should ideally not happen if a file is listed in the tree for the given ref.
          this.logger.warn(
            `No commit history found for file: ${fullPath} on ref ${this.branchRef}. This may indicate an inconsistency.`,
          );
        }

        return {
          ...hardenedFile,
          lastModified,
        };
      } catch (error: any) {
        // Log the error and return the file without lastModified or with it as undefined
        this.logger.error(
          `Failed to fetch commit history for ${fullPath} on ref ${this.branchRef}. Error: ${error.message}`,
          error, // Log the full error object for more details
        );
        return {
          ...hardenedFile,
          lastModified: dateZero, // default to 1970-01-01
        };
      }
    });

    const filesWithLastModified = await Promise.all(filesWithLastModifiedPromises);
    return filesWithLastModified;
  }

  private async executeActions(actions: SyncAction[]): Promise<SyncChange[]> {
    const syncChangePromises: Promise<SyncChange[]>[] = [];

    for (const action of actions) {
      switch (true) {
        case isRepoCreateGlobalsAction(action):
          syncChangePromises.push(this._performRepoCreateGlobalsAction(action));
          break;
        case isRepoUpdateGlobalsAction(action):
          syncChangePromises.push(this._performRepoUpdateGlobalsAction(action));
          break;
        case isAgentsmithCreatePromptAction(action):
          syncChangePromises.push(this._performAgentsmithCreatePromptAction(action));
          break;
        case isAgentsmithUpdatePromptAction(action):
          syncChangePromises.push(this._performAgentsmithUpdatePromptAction(action));
          break;
        case isAgentsmithCreateVersionAction(action):
          syncChangePromises.push(this._performAgentsmithCreateVersionAction(action));
          break;
        case isAgentsmithUpdateVersionAction(action):
          syncChangePromises.push(this._performAgentsmithUpdateVersionAction(action));
          break;
        case isAgentsmithUpdateVariablesAction(action):
          syncChangePromises.push(this._performAgentsmithUpdateVariablesAction(action));
          break;
        case isAgentsmithUpdateContentAction(action):
          syncChangePromises.push(this._performAgentsmithUpdateContentAction(action));
          break;
        case isRepoCreatePromptAction(action):
          syncChangePromises.push(this._performRepoCreatePromptAction(action));
          break;
        case isRepoUpdatePromptAction(action):
          syncChangePromises.push(this._performRepoUpdatePromptAction(action));
          break;
        case isRepoCreateVersionAction(action):
          syncChangePromises.push(this._performRepoCreateVersionAction(action));
          break;
        case isRepoUpdateVersionAction(action):
          syncChangePromises.push(this._performRepoUpdateVersionAction(action));
          break;
        case isRepoUpdateContentAction(action):
          syncChangePromises.push(this._performRepoUpdateContentAction(action));
          break;
        case isRepoDeleteVersionAction(action):
          syncChangePromises.push(this._performRepoDeleteVersionAction(action));
          break;
        case isRepoCreateVariablesAction(action):
          syncChangePromises.push(this._performRepoCreateVariablesAction(action));
          break;
        case isRepoUpdateVariablesAction(action):
          syncChangePromises.push(this._performRepoUpdateVariablesAction(action));
          break;
        case isRepoDeleteVariablesAction(action):
          syncChangePromises.push(this._performRepoDeleteVariablesAction(action));
          break;
        case isRepoDeleteContentAction(action):
          syncChangePromises.push(this._performRepoDeleteContentAction(action));
          break;
        case isRepoCreateAgentsmithTypesAction(action):
          // Do nothing, the regenerate needs to be the last action to run below
          break;
        case isRepoUpdateAgentsmithTypesAction(action):
          // Do nothing, the regenerate needs to be the last action to run below
          break;
        default:
          throw new Error(
            `Unknown action type: ${action.type} on entity: ${action.entity} on target: ${action.target}`,
          );
      }
    }

    const syncChanges = (await Promise.all(syncChangePromises)).flat();

    const regenerateAgentsmithTypesAction = actions.find(
      (action) =>
        isRepoCreateAgentsmithTypesAction(action) || isRepoUpdateAgentsmithTypesAction(action),
    );

    if (regenerateAgentsmithTypesAction) {
      switch (true) {
        case isRepoCreateAgentsmithTypesAction(regenerateAgentsmithTypesAction):
          const createTypesSyncChanges = await this._performRepoCreateAgentsmithTypesAction();

          syncChanges.push(...createTypesSyncChanges);
          break;
        case isRepoUpdateAgentsmithTypesAction(regenerateAgentsmithTypesAction):
          const updateTypesSyncChanges = await this._performRepoUpdateAgentsmithTypesAction();

          syncChanges.push(...updateTypesSyncChanges);
          break;
        default:
          throw new Error(`Unknown create or update agentsmith types action`);
      }
    }

    return syncChanges;
  }

  private async _performRepoCreateGlobalsAction(
    action: RepoCreateGlobalsAction,
  ): Promise<SyncChange[]> {
    const { globals } = action;

    const filePath = globalsJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
    });

    const result = await this._createRepoFile({
      path: filePath,
      content: JSON.stringify(globals.content, null, 2),
      message: `create globals.json`,
    });

    await this.services.projects.updateProjectGlobalsSha(this.projectId, result.sha);

    return [
      {
        target: 'repo',
        type: 'create',
        entity: 'globals',
        oldContent: null,
        newContent: JSON.stringify(globals.content, null, 2),
        oldSha: null,
        newSha: result.sha,
      },
    ];
  }

  private async _performRepoUpdateGlobalsAction(
    action: RepoUpdateGlobalsAction,
  ): Promise<SyncChange[]> {
    const { globals } = action;

    const filePath = globalsJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
    });

    const file = await this._getRepoFileContentString(filePath);

    if (!file) {
      throw new Error(`Failed to get file content for ${filePath} at ref ${this.branchRef}`);
    }

    const result = await this._updateRepoFile({
      path: filePath,
      content: JSON.stringify(globals.content, null, 2),
      message: `update globals.json`,
      sha: file.sha,
    });

    await this.services.projects.updateProjectGlobalsSha(this.projectId, result.sha);

    return [
      {
        target: 'repo',
        type: 'update',
        entity: 'globals',
        oldContent: file.content,
        newContent: JSON.stringify(globals.content, null, 2),
        oldSha: file.sha,
        newSha: result.sha,
      },
    ];
  }

  private async _performAgentsmithCreatePromptAction(
    action: AgentsmithCreatePromptAction,
  ): Promise<SyncChange[]> {
    const { slug, sha } = action;

    const filePath = promptJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug: slug,
    });

    const file = await this._getRepoFileContentString(filePath);

    if (!file) {
      throw new Error(`Failed to get file content for ${filePath} at ref ${this.branchRef}`);
    }

    // TODO: Handle the case where the file is not a valid prompt.json file
    // write a fn that asserts the type of the file content, but only if it passes a JSON parse and a check for the required fields
    const parsedContent = JSON.parse(file.content) as PromptJSONFileContent;

    await this.services.prompts.createPrompt({
      projectId: this.projectId,
      name: parsedContent.name,
      slug,
      sha,
    });

    return [
      {
        target: 'agentsmith',
        type: 'create',
        entity: 'prompt',
        promptSlug: slug,
        promptVersion: null,
        oldContent: null,
        newContent: file.content,
        oldSha: null,
        newSha: sha,
      },
    ];
  }

  private async _performAgentsmithUpdatePromptAction(
    action: AgentsmithUpdatePromptAction,
  ): Promise<SyncChange[]> {
    const { slug, oldContent, oldSha, newSha } = action;

    const filePath = promptJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug: slug,
    });

    const file = await this._getRepoFileContentString(filePath);

    if (!file) {
      throw new Error(`Failed to get file content for ${filePath} at ref ${this.branchRef}`);
    }

    const parsedContent = parsePromptJSONFile(file.content);

    await this.services.prompts.updatePrompt({
      projectId: this.projectId,
      promptUuid: parsedContent.uuid,
      name: parsedContent.name,
      sha: newSha,
    });

    return [
      {
        target: 'agentsmith',
        type: 'update',
        entity: 'prompt',
        promptSlug: slug,
        promptVersion: null,
        oldContent,
        newContent: file.content,
        oldSha,
        newSha,
      },
    ];
  }

  private async _performAgentsmithCreateVersionAction(
    action: AgentsmithCreateVersionAction,
  ): Promise<SyncChange[]> {
    const { promptSlug, version, versionSha, variablesSha, contentSha } = action;

    const syncChanges: SyncChange[] = [];

    const versionFilePath = versionJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version,
    });

    const versionFile = await this._getRepoFileContentString(versionFilePath);

    if (!versionFile) {
      throw new Error(`Failed to get file content for ${versionFilePath} at ref ${this.branchRef}`);
    }

    const contentFilePath = contentJ2FilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version,
    });

    const contentFile = await this._getRepoFileContentString(contentFilePath);

    if (!contentFile) {
      throw new Error(`Failed to get file content for ${contentFilePath} at ref ${this.branchRef}`);
    }

    const { isValid, error } = validateTemplate(contentFile.content);

    if (!isValid) {
      throw new Error(`Invalid content for ${contentFilePath} at ref ${this.branchRef}: ${error}`);
    }

    const variablesFilePath = variablesJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version,
    });

    const variablesFile = await this._getRepoFileContentString(variablesFilePath);

    if (!variablesFile) {
      this.logger.warn(
        `Failed to get file content for ${variablesFilePath} at ref ${this.branchRef}, assuming no variables`,
      );
    }

    const parsedVersionFile = parsePromptVersionJSONFile(versionFile.content);
    const parsedVariablesFile = variablesFile
      ? parsePromptVariableJSONFile(variablesFile.content)
      : [];

    let status = parsedVersionFile.status as Database['public']['Enums']['prompt_status'];

    // we never want repo to create a version that is published on feature branches
    if (!this.isMainBranch && status !== 'DRAFT') {
      status = 'DRAFT';
    }

    const config = parsedVersionFile.config as any;
    const content = contentFile.content;

    await this.services.prompts.createPromptVersion({
      projectId: this.projectId,
      uuid: parsedVersionFile.uuid,
      promptSlug,
      version,
      status,
      config,
      content,
      versionSha,
      variablesSha,
      contentSha,
    });

    syncChanges.push(
      {
        target: 'agentsmith',
        type: 'create',
        entity: 'version',
        promptSlug,
        promptVersion: version,
        oldContent: null,
        newContent: versionFile.content,
        oldSha: null,
        newSha: versionSha,
      },
      {
        target: 'agentsmith',
        type: 'create',
        entity: 'content',
        promptSlug,
        promptVersion: version,
        oldContent: null,
        newContent: contentFile.content,
        oldSha: null,
        newSha: contentFile.sha,
      },
    );

    if (variablesFile && parsedVariablesFile.length > 0) {
      const variables = parsedVariablesFile.map((v) => ({
        ...v,
        default_value:
          v.default_value !== null && typeof v.default_value !== 'string'
            ? JSON.stringify(v.default_value)
            : v.default_value,
      }));

      await this.services.prompts.createPromptVariables({
        promptVersionUuid: parsedVersionFile.uuid,
        variables,
      });

      syncChanges.push({
        target: 'agentsmith',
        type: 'create',
        entity: 'variables',
        promptSlug,
        promptVersion: version,
        oldContent: null,
        newContent: variablesFile.content,
        oldSha: null,
        newSha: variablesFile.sha,
      });
    }

    return syncChanges;
  }

  private async _performAgentsmithUpdateVersionAction(
    action: AgentsmithUpdateVersionAction,
  ): Promise<SyncChange[]> {
    const { promptSlug, version, newSha } = action;

    const versionFilePath = versionJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version,
    });

    const versionFile = await this._getRepoFileContentString(versionFilePath);

    if (!versionFile) {
      throw new Error(`Failed to get file content for ${versionFilePath} at ref ${this.branchRef}`);
    }

    const versionFileJson = parsePromptVersionJSONFile(versionFile.content);

    let status = versionFileJson.status as Database['public']['Enums']['prompt_status'];

    // we never want repo to create a version that is published on feature branches
    if (!this.isMainBranch && status !== 'DRAFT') {
      status = 'DRAFT';
    }

    await this.services.prompts.updatePromptVersionSinglular({
      promptVersionUuid: versionFileJson.uuid,
      config: versionFileJson.config as any,
      status,
      sha: newSha,
    });

    return [
      {
        target: 'agentsmith',
        type: 'update',
        entity: 'version',
        promptSlug,
        promptVersion: version,
        oldContent: action.oldContent,
        newContent: versionFile.content,
        oldSha: action.oldSha,
        newSha,
      },
    ];
  }

  private async _performAgentsmithUpdateVariablesAction(
    action: AgentsmithUpdateVariablesAction,
  ): Promise<SyncChange[]> {
    const { promptSlug, version, oldContent, oldSha, newSha } = action;

    const variablesFilePath = variablesJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version,
    });

    const variablesFile = await this._getRepoFileContentString(variablesFilePath);

    if (!variablesFile) {
      throw new Error(
        `Failed to get file content for ${variablesFilePath} at ref ${this.branchRef}`,
      );
    }

    const parsedVariablesFile = parsePromptVariableJSONFile(variablesFile.content);

    const variables = parsedVariablesFile.map((v) => ({
      name: v.name,
      type: v.type,
      uuid: v.uuid,
      required: v.required,
      default_value:
        v.default_value !== null && typeof v.default_value !== 'string'
          ? JSON.stringify(v.default_value)
          : v.default_value,
    }));

    await this.services.prompts.updatePromptVariables({
      promptSlug,
      promptVersion: version,
      variables,
      sha: newSha,
    });

    return [
      {
        target: 'agentsmith',
        type: 'update',
        entity: 'variables',
        promptSlug,
        promptVersion: version,
        oldContent,
        newContent: variablesFile.content,
        oldSha,
        newSha,
      },
    ];
  }

  private async _performAgentsmithUpdateContentAction(
    action: AgentsmithUpdateContentAction,
  ): Promise<SyncChange[]> {
    const { promptSlug, version, promptVersionUuid, oldContent, oldSha, newSha } = action;

    const contentFilePath = contentJ2FilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version,
    });

    const contentFile = await this._getRepoFileContentString(contentFilePath);

    if (!contentFile) {
      throw new Error(`Failed to get file content for ${contentFilePath} at ref ${this.branchRef}`);
    }

    const { isValid, error } = validateTemplate(contentFile.content);

    if (!isValid) {
      throw new Error(`Invalid content for ${contentFilePath} at ref ${this.branchRef}: ${error}`);
    }

    await this.services.prompts.updatePromptVersionContent({
      promptVersionUuid,
      content: contentFile.content,
      contentSha: newSha,
    });

    return [
      {
        target: 'agentsmith',
        type: 'update',
        entity: 'content',
        promptSlug,
        promptVersion: version,
        oldContent,
        newContent: contentFile.content,
        oldSha,
        newSha,
      },
    ];
  }

  private async _performRepoCreatePromptAction(
    action: RepoCreatePromptAction,
  ): Promise<SyncChange[]> {
    const { prompt } = action;

    const promptFilePath = promptJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug: prompt.slug,
    });

    const promptContent = JSON.stringify(generatePromptJsonContent(prompt), null, 2);

    const message = `create prompt ${prompt.slug}`;

    const { sha } = await this._createRepoFile({
      path: promptFilePath,
      content: promptContent,
      message,
    });

    await this.services.prompts.updatePrompt({
      promptUuid: prompt.uuid,
      projectId: this.projectId,
      name: prompt.name,
      sha,
    });

    return [
      {
        target: 'repo',
        type: 'create',
        entity: 'prompt',
        promptSlug: prompt.slug,
        promptVersion: null,
        oldContent: null,
        newContent: promptContent,
        oldSha: null,
        newSha: sha,
      },
    ];
  }

  private async _performRepoUpdatePromptAction(
    action: RepoUpdatePromptAction,
  ): Promise<SyncChange[]> {
    const { prompt } = action;

    const promptFilePath = promptJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug: prompt.slug,
    });

    const oldFile = await this._getRepoFileContentString(promptFilePath);

    if (!oldFile) {
      throw new Error(`Failed to get file content for ${promptFilePath} at ref ${this.branchRef}`);
    }

    const message = `update prompt ${prompt.slug} `;

    const promptContent = JSON.stringify(generatePromptJsonContent(prompt), null, 2);

    const { sha } = await this._updateRepoFile({
      path: promptFilePath,
      content: promptContent,
      message,
      sha: oldFile.sha,
    });

    await this.services.prompts.updatePrompt({
      promptUuid: prompt.uuid,
      projectId: this.projectId,
      name: prompt.name,
      sha,
    });

    return [
      {
        target: 'repo',
        type: 'update',
        entity: 'prompt',
        promptSlug: prompt.slug,
        promptVersion: null,
        oldContent: oldFile.content,
        newContent: promptContent,
        oldSha: oldFile.sha,
        newSha: sha,
      },
    ];
  }

  private async _performRepoCreateVersionAction(
    action: RepoCreateVersionAction,
  ): Promise<SyncChange[]> {
    const { promptSlug, promptVersion } = action;

    const syncChanges: SyncChange[] = [];

    const versionFilePath = versionJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version: promptVersion.version,
    });

    const versionContent = JSON.stringify(generatePromptVersionJsonContent(promptVersion), null, 2);

    const { sha } = await this._createRepoFile({
      path: versionFilePath,
      content: versionContent,
      message: `create version ${promptSlug}:${promptVersion.version}`,
    });

    await this.services.prompts.updatePromptVersionSha({
      promptVersionUuid: promptVersion.uuid,
      sha,
    });

    if (promptVersion.prompt_variables.length > 0) {
      const variablesFilePath = variablesJsonFilePath({
        agentsmithFolder: this.agentsmithFolder,
        promptSlug,
        version: promptVersion.version,
      });

      const variablesContent = JSON.stringify(
        generatePromptVariablesJsonContent(promptVersion.prompt_variables),
        null,
        2,
      );

      const { sha: variablesSha } = await this._createRepoFile({
        path: variablesFilePath,
        content: variablesContent,
        message: `create variables ${promptSlug}:${promptVersion.version}`,
      });

      await this.services.prompts.updatePromptVersionVariablesSha({
        promptVersionUuid: promptVersion.uuid,
        sha: variablesSha,
      });

      syncChanges.push({
        target: 'repo',
        type: 'create',
        entity: 'variables',
        promptSlug,
        promptVersion: promptVersion.version,
        oldContent: null,
        newContent: variablesContent,
        oldSha: null,
        newSha: variablesSha,
      });
    }

    const contentFilePath = contentJ2FilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version: promptVersion.version,
    });

    const contentContent = promptVersion.content;

    const { isValid, error } = validateTemplate(contentContent);

    if (!isValid) {
      throw new Error(`Invalid content for ${contentFilePath} at ref ${this.branchRef}: ${error}`);
    }

    const { sha: contentSha } = await this._createRepoFile({
      path: contentFilePath,
      content: contentContent,
      message: `create content ${promptSlug}:${promptVersion.version}`,
    });

    await this.services.prompts.updatePromptVersionContentSha({
      promptVersionUuid: promptVersion.uuid,
      sha: contentSha,
    });

    syncChanges.push(
      {
        target: 'repo',
        type: 'create',
        entity: 'version',
        promptSlug,
        promptVersion: promptVersion.version,
        oldContent: null,
        newContent: versionContent,
        oldSha: null,
        newSha: sha,
      },
      {
        target: 'repo',
        type: 'create',
        entity: 'content',
        promptSlug,
        promptVersion: promptVersion.version,
        oldContent: null,
        newContent: contentContent,
        oldSha: null,
        newSha: contentSha,
      },
    );

    return syncChanges;
  }

  private async _performRepoUpdateVersionAction(
    action: RepoUpdateVersionAction,
  ): Promise<SyncChange[]> {
    const { promptSlug, promptVersion } = action;

    const versionFilePath = versionJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version: promptVersion.version,
    });

    const oldFile = await this._getRepoFileContentString(versionFilePath);

    if (!oldFile) {
      throw new Error(`Failed to get file content for ${versionFilePath} at ref ${this.branchRef}`);
    }

    const versionContent = JSON.stringify(generatePromptVersionJsonContent(promptVersion), null, 2);

    const message = `update version ${promptSlug}:${promptVersion.version}`;

    const { sha } = await this._updateRepoFile({
      path: versionFilePath,
      content: versionContent,
      message,
      sha: oldFile.sha,
    });

    await this.services.prompts.updatePromptVersionSha({
      promptVersionUuid: promptVersion.uuid,
      sha,
    });

    return [
      {
        target: 'repo',
        type: 'update',
        entity: 'version',
        promptSlug,
        promptVersion: promptVersion.version,
        oldContent: oldFile.content,
        newContent: versionContent,
        oldSha: oldFile.sha,
        newSha: sha,
      },
    ];
  }

  private async _performRepoUpdateContentAction(
    action: RepoUpdateContentAction,
  ): Promise<SyncChange[]> {
    const { promptSlug, promptVersion } = action;

    const contentFilePath = contentJ2FilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version: promptVersion.version,
    });

    const oldFile = await this._getRepoFileContentString(contentFilePath);

    if (!oldFile) {
      throw new Error(`Failed to get file content for ${contentFilePath} at ref ${this.branchRef}`);
    }

    const contentContent = promptVersion.content;

    const message = `update content ${promptSlug}:${promptVersion.version}`;

    const { sha } = await this._updateRepoFile({
      path: contentFilePath,
      content: contentContent,
      message,
      sha: oldFile.sha,
    });

    await this.services.prompts.updatePromptVersionContentSha({
      promptVersionUuid: promptVersion.uuid,
      sha,
    });

    return [
      {
        target: 'repo',
        type: 'update',
        entity: 'content',
        promptSlug,
        promptVersion: promptVersion.version,
        oldContent: oldFile.content,
        newContent: contentContent,
        oldSha: oldFile.sha,
        newSha: sha,
      },
    ];
  }

  private async _performRepoDeleteVersionAction(
    action: RepoDeleteVersionAction,
  ): Promise<SyncChange[]> {
    const { promptSlug, promptVersion } = action;

    const syncChanges: SyncChange[] = [];

    const versionFilePath = versionJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version: promptVersion.version,
    });

    const versionFile = await this._getRepoFileContentString(versionFilePath);

    if (!versionFile) {
      throw new Error(`Failed to get file content for ${versionFilePath} at ref ${this.branchRef}`);
    }

    await this._deleteRepoFile({
      path: versionFilePath,
      entity: 'version',
      sha: versionFile.sha,
    });

    await this.services.prompts.updatePromptVersionSha({
      promptVersionUuid: promptVersion.uuid,
      sha: null,
    });

    if (promptVersion.prompt_variables.length > 0) {
      const variablesFilePath = variablesJsonFilePath({
        agentsmithFolder: this.agentsmithFolder,
        promptSlug,
        version: promptVersion.version,
      });

      const variablesFile = await this._getRepoFileContentString(variablesFilePath);

      if (!variablesFile) {
        throw new Error(
          `Failed to get file content for ${variablesFilePath} at ref ${this.branchRef}`,
        );
      }

      await this._deleteRepoFile({
        path: variablesFilePath,
        entity: 'variables',
        sha: variablesFile.sha,
      });

      await this.services.prompts.updatePromptVersionVariablesSha({
        promptVersionUuid: promptVersion.uuid,
        sha: null,
      });

      syncChanges.push({
        target: 'repo',
        type: 'delete',
        entity: 'variables',
        promptSlug,
        promptVersion: promptVersion.version,
        oldContent: variablesFile.content,
        newContent: null,
        oldSha: variablesFile.sha,
        newSha: null,
      });
    }

    const contentFilePath = contentJ2FilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version: promptVersion.version,
    });

    const contentFile = await this._getRepoFileContentString(contentFilePath);

    if (!contentFile) {
      throw new Error(`Failed to get file content for ${contentFilePath} at ref ${this.branchRef}`);
    }

    await this._deleteRepoFile({
      path: contentFilePath,
      entity: 'content',
      sha: contentFile.sha,
    });

    await this.services.prompts.updatePromptVersionContentSha({
      promptVersionUuid: promptVersion.uuid,
      sha: null,
    });

    syncChanges.push(
      {
        target: 'repo',
        type: 'delete',
        entity: 'version',
        promptSlug,
        promptVersion: promptVersion.version,
        oldContent: versionFile.content,
        newContent: null,
        oldSha: versionFile.sha,
        newSha: null,
      },
      {
        target: 'repo',
        type: 'delete',
        entity: 'content',
        promptSlug,
        promptVersion: promptVersion.version,
        oldContent: contentFile.content,
        newContent: null,
        oldSha: contentFile.sha,
        newSha: null,
      },
    );

    return syncChanges;
  }

  private async _performRepoCreateVariablesAction(
    action: RepoCreateVariablesAction,
  ): Promise<SyncChange[]> {
    const { promptSlug, version, promptVersionUuid, promptVariables } = action;

    const variablesFilePath = variablesJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version,
    });

    const variablesContent = JSON.stringify(
      generatePromptVariablesJsonContent(promptVariables),
      null,
      2,
    );

    const message = `create variables ${promptSlug}:${version}`;

    const { sha } = await this._createRepoFile({
      path: variablesFilePath,
      content: variablesContent,
      message,
    });

    await this.services.prompts.updatePromptVersionVariablesSha({
      promptVersionUuid,
      sha,
    });

    return [
      {
        target: 'repo',
        type: 'create',
        entity: 'variables',
        promptSlug,
        promptVersion: version,
        oldContent: null,
        newContent: variablesContent,
        oldSha: null,
        newSha: sha,
      },
    ];
  }

  private async _performRepoUpdateVariablesAction(
    action: RepoUpdateVariablesAction,
  ): Promise<SyncChange[]> {
    const { promptSlug, version, promptVersionUuid, promptVariables } = action;

    const variablesFilePath = variablesJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version,
    });

    const oldFile = await this._getRepoFileContentString(variablesFilePath);

    if (!oldFile) {
      throw new Error(
        `Failed to get file content for ${variablesFilePath} at ref ${this.branchRef}`,
      );
    }

    const variablesContent = JSON.stringify(
      generatePromptVariablesJsonContent(promptVariables),
      null,
      2,
    );

    const message = `update variables ${promptSlug}:${version}`;

    const { sha } = await this._updateRepoFile({
      path: variablesFilePath,
      content: variablesContent,
      message,
      sha: oldFile.sha,
    });

    await this.services.prompts.updatePromptVersionVariablesSha({
      promptVersionUuid,
      sha,
    });

    return [
      {
        target: 'repo',
        type: 'update',
        entity: 'variables',
        promptSlug,
        promptVersion: version,
        oldContent: oldFile.content,
        newContent: variablesContent,
        oldSha: oldFile.sha,
        newSha: sha,
      },
    ];
  }

  private async _performRepoDeleteVariablesAction(
    action: RepoDeleteVariablesAction,
  ): Promise<SyncChange[]> {
    const { promptSlug, version, promptVersionUuid } = action;

    const variablesFilePath = variablesJsonFilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version,
    });

    const oldFile = await this._getRepoFileContentString(variablesFilePath);

    if (!oldFile) {
      throw new Error(
        `Failed to get file content for ${variablesFilePath} at ref ${this.branchRef}`,
      );
    }

    await this._deleteRepoFile({
      path: variablesFilePath,
      entity: 'variables',
      sha: oldFile.sha,
    });

    await this.services.prompts.updatePromptVersionVariablesSha({
      promptVersionUuid,
      sha: null,
    });

    return [
      {
        target: 'repo',
        type: 'delete',
        entity: 'variables',
        promptSlug,
        promptVersion: version,
        oldContent: oldFile.content,
        newContent: null,
        oldSha: oldFile.sha,
        newSha: null,
      },
    ];
  }

  private async _performRepoDeleteContentAction(
    action: RepoDeleteContentAction,
  ): Promise<SyncChange[]> {
    const { promptSlug, version, promptVersionUuid } = action;

    const contentFilePath = contentJ2FilePath({
      agentsmithFolder: this.agentsmithFolder,
      promptSlug,
      version,
    });

    const oldFile = await this._getRepoFileContentString(contentFilePath);

    if (!oldFile) {
      throw new Error(`Failed to get file content for ${contentFilePath} at ref ${this.branchRef}`);
    }

    await this._deleteRepoFile({
      path: contentFilePath,
      entity: 'content',
      sha: oldFile.sha,
    });

    await this.services.prompts.updatePromptVersionContentSha({
      promptVersionUuid,
      sha: null,
    });

    return [
      {
        target: 'repo',
        type: 'delete',
        entity: 'content',
        promptSlug,
        promptVersion: version,
        oldContent: oldFile.content,
        newContent: null,
        oldSha: oldFile.sha,
        newSha: null,
      },
    ];
  }

  private async _performRepoCreateAgentsmithTypesAction(): Promise<SyncChange[]> {
    const agentsmithTypesFilePath = agentsmithTypesTsFilePath({
      agentsmithFolder: this.agentsmithFolder,
    });

    // generate the agentsmith types
    const typesContent = await this.services.typegen.generateTypes({
      projectId: this.projectId,
    });

    // write them to github
    const { sha } = await this._createRepoFile({
      path: agentsmithTypesFilePath,
      content: typesContent,
      message: `create agentsmith types`,
    });

    return [
      {
        target: 'repo',
        type: 'create',
        entity: 'agentsmithTypes',
        oldContent: null,
        newContent: typesContent,
        oldSha: null,
        newSha: sha,
      },
    ];
  }

  private async _performRepoUpdateAgentsmithTypesAction(): Promise<SyncChange[]> {
    const agentsmithTypesFilePath = agentsmithTypesTsFilePath({
      agentsmithFolder: this.agentsmithFolder,
    });

    // get old sha
    const oldFile = await this._getRepoFileContentString(agentsmithTypesFilePath);

    if (!oldFile) {
      throw new Error(
        `Failed to get file content for ${agentsmithTypesFilePath} at ref ${this.branchRef}`,
      );
    }

    // generate the agentsmith types
    const typesContent = await this.services.typegen.generateTypes({
      projectId: this.projectId,
    });

    // write them to github
    const { sha } = await this._updateRepoFile({
      path: agentsmithTypesFilePath,
      content: typesContent,
      message: `update agentsmith types`,
      sha: oldFile.sha,
    });

    return [
      {
        target: 'repo',
        type: 'update',
        entity: 'agentsmithTypes',
        oldContent: oldFile.content,
        newContent: typesContent,
        oldSha: oldFile.sha,
        newSha: sha,
      },
    ];
  }

  private async _createRepoFile(options: CreateRepoFileOptions): Promise<{ sha: string }> {
    const { path, content, message } = options;

    const base64Content = base64Encode(content);

    try {
      const response = await this.octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: base64Content,
        branch: this.branchRef,
      });

      if (!response.data?.content?.sha) {
        throw new Error(`commit sha was missing from response for ${path}`);
      }

      return { sha: response.data.content.sha };
    } catch (error: any) {
      this.logger.error(`Failed to write ${path}: ${error}`);
      throw new Error(`Failed to write ${path}: ${error}`);
    }
  }

  private async _updateRepoFile(options: UpdateRepoFileOptions): Promise<{ sha: string }> {
    const { path, content, message, sha } = options;

    const base64Content = base64Encode(content);

    try {
      const response = await this.octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: base64Content,
        branch: this.branchRef,
        sha,
      });

      if (!response.data?.content?.sha) {
        throw new Error(`commit sha was missing from response for ${path}`);
      }

      return { sha: response.data.content.sha };
    } catch (error: any) {
      this.logger.error(`Failed to write ${path}: ${error}`);
      throw new Error(`Failed to write ${path}: ${error}`);
    }
  }

  private async _deleteRepoFile(options: DeleteRepoFileOptions): Promise<void> {
    const { path, entity, sha } = options;

    const message = `Agentsmith Sync: delete ${entity}`;

    await this.octokit.request('DELETE /repos/{owner}/{repo}/contents/{path}', {
      owner: this.owner,
      repo: this.repo,
      path,
      message,
      ref: this.branchRef,
      sha,
    });
  }

  /** Fetches raw file content from GitHub as a string, handling potential 404s */
  private async _getRepoFileContentString(
    path: string,
  ): Promise<{ content: string; sha: string } | null> {
    try {
      const { data } = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branchRef,
      });

      if (!Array.isArray(data) && data.type === 'file' && data.content) {
        const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
        return {
          content: fileContent,
          sha: data.sha,
        };
      }
      this.logger.warn(
        `Could not get file content for ${path} at ref ${this.branchRef}. Response type was not 'file' or content was missing.`,
      );
      return null;
    } catch (error: any) {
      if (error.status === 404) {
        this.logger.warn(`File ${path} at ref ${this.branchRef} not found.`);
        return null;
      }
      this.logger.error(`Failed to fetch content for ${path} at ref ${this.branchRef}:`, error);
      return null;
    }
  }
}
