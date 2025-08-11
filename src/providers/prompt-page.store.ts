import { createStore } from 'zustand/vanilla';
import { toast } from 'sonner';
import { EditorPromptVariable, IncludedPrompt } from '@/types/prompt-editor';
import {
  EditorPromptPvChatPrompt,
  GetAllPromptsDataResult,
  UpdatePromptVersionOptions,
} from '@/lib/PromptsService';
import { CompletionConfig, Message } from '@/lib/openrouter';
import { VersionType } from '@/app/constants';
import {
  compileChatPrompts,
  compilePrompt,
  ParsedInclude,
  validateGlobalContext,
  validateVariables,
} from '@/utils/template-utils';
import { makePromptLoader } from '@/utils/make-prompt-loader';
import { mergeIncludedVariables } from '@/utils/merge-included-variables';
import { updatePromptVersion, createDraftVersion } from '@/app/actions/prompts';
import isEqual from 'lodash.isequal';
import { createClient } from '@/lib/supabase/client';
import { PromptsService } from '@/lib/PromptsService';
import { routes } from '@/utils/routes';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

type PromptData = NonNullable<GetAllPromptsDataResult>[0];
type PromptVersion = PromptData['prompt_versions'][0];

export type PromptPageState = {
  // Core Data
  prompt: PromptData;
  currentVersion: PromptVersion;
  allVersions: PromptVersion[];
  latestVersion: PromptVersion;
  globalContext: Record<string, any>;

  // Data from Editor/Test Prompt Modal/Compile to Clipboard Modal
  inputVariables: Record<string, string | number | boolean | object>;
  editorVariables: EditorPromptVariable[];
  editorContent: string;
  editorConfig: CompletionConfig;
  editorPvChatPrompts: EditorPromptPvChatPrompt[];

  // Derived/UI State
  includedPrompts: IncludedPrompt[];
  mergedIncludedVariables: EditorPromptVariable[];
  invalidIncludes: Set<ParsedInclude>;
  notExistingIncludes: Set<string>;
  missingGlobals: string[];
  missingRequiredVariables: EditorPromptVariable[];
  variablesWithDefaults: Record<string, string | number | boolean | object>;
  compiledPrompt: string;
  compiledMessages: Message[];

  // Status Flags
  isSaving: boolean;
  isCreatingVersion: boolean;
  isPublishing: boolean;
  operationError: string | null;
  hasChanges: boolean;
  mode: 'view' | 'edit';

  // Modal Visibility
  isTestModalOpen: boolean;
  isCompileToClipboardModalOpen: boolean;
  isCreateVersionModalOpen: boolean;
  isPublishConfirmModalOpen: boolean;
};

export type PromptPageActions = {
  // Modal handlers
  openTestModal: () => void;
  closeTestModal: () => void;
  openCompileToClipboardModal: () => void;
  closeCompileToClipboardModal: () => void;
  openCreateVersionModal: () => void;
  closeCreateVersionModal: () => void;
  openPublishConfirm: () => void;
  closePublishConfirm: () => void;

  // Action handlers
  handleSave: (status: 'DRAFT' | 'PUBLISHED') => Promise<void>;
  handleCreateNewVersion: (options: {
    versionType: VersionType;
    fromVersionUuid: string;
    customVersion?: string;
  }) => Promise<void>;
  setInputVariables: (variables: Record<string, string | number | boolean | object>) => void;
  updateIncludes: (includes: ParsedInclude[]) => Promise<void>;
  updateEditorVariables: (variables: EditorPromptVariable[]) => void;
  updateEditorContent: (content: string) => void;
  updateEditorConfig: (config: CompletionConfig) => void;
  updateEditorPvChatPromptContent: (index: number, content: string) => void;
  addEditorPvChatPrompt: (options: {
    role: 'system' | 'user' | 'assistant';
    content?: string;
    index?: number;
  }) => void;
  removeEditorPvChatPrompt: (index: number) => void;
};

type StoreDependencies = {
  router: AppRouterInstance;
  selectedProjectUuid: string;
  selectedProject: any;
  showSyncTooltip: () => void;
};

export type PromptPageStore = PromptPageState & PromptPageActions;

// Helper functions
const _compilePrompt = (state: PromptPageState) => {
  try {
    const { variablesWithDefaults } = validateVariables(
      state.mergedIncludedVariables,
      state.inputVariables,
    );
    const promptLoader = makePromptLoader(state.currentVersion.prompt_includes);

    const finalVariablesForCompilation = {
      ...variablesWithDefaults,
      global: state.globalContext,
    };

    const compiledPrompt = compilePrompt(
      state.editorContent,
      finalVariablesForCompilation,
      promptLoader,
    );

    return compiledPrompt;
  } catch (error) {
    // Return previous compiled prompt on error
    return state.compiledPrompt;
  }
};

const _compileMessages = (state: PromptPageState) => {
  try {
    const { variablesWithDefaults } = validateVariables(
      state.mergedIncludedVariables,
      state.inputVariables,
    );
    const promptLoader = makePromptLoader(state.includedPrompts);

    const finalVariablesForCompilation = {
      ...variablesWithDefaults,
      global: state.globalContext,
    };

    const compiledMessages = compileChatPrompts(
      state.editorPvChatPrompts,
      finalVariablesForCompilation,
      promptLoader,
    );

    return compiledMessages;
  } catch (error) {
    // Return previous compiled messages on error
    return state.compiledMessages;
  }
};

export const createPromptPageStore = (initialState: PromptPageState, deps: StoreDependencies) => {
  return createStore<PromptPageStore>()((set, get) => ({
    ...initialState,

    // Modal handlers
    openTestModal: () => {
      const state = get();
      if (state.hasChanges) {
        if (state.currentVersion.status === 'DRAFT') {
          get()
            .handleSave('DRAFT')
            .then(() => {
              set({ isTestModalOpen: true });
            });
          return;
        }
        if (state.currentVersion.status === 'PUBLISHED') {
          set({ isPublishConfirmModalOpen: true });
          return;
        }
      }
      set({ isTestModalOpen: true });
    },

    closeTestModal: () => set({ isTestModalOpen: false }),

    openCompileToClipboardModal: () => {
      const state = get();
      if (state.editorVariables.length === 0) {
        const targetContent =
          state.currentVersion.type === 'CHAT'
            ? JSON.stringify(state.compiledMessages, null, 2)
            : state.compiledPrompt;
        navigator.clipboard
          .writeText(targetContent)
          .then(() => {
            toast.success('Compiled prompt copied to clipboard!');
          })
          .catch(() => {
            toast.error('Failed to copy prompt to clipboard');
          });
      } else {
        const compiledPrompt = _compilePrompt(state);
        const compiledMessages = _compileMessages(state);
        set({ isCompileToClipboardModalOpen: true, compiledPrompt, compiledMessages });
      }
    },

    closeCompileToClipboardModal: () => set({ isCompileToClipboardModalOpen: false }),

    openCreateVersionModal: () => set({ isCreateVersionModalOpen: true }),

    closeCreateVersionModal: () => set({ isCreateVersionModalOpen: false }),

    openPublishConfirm: () => set({ isPublishConfirmModalOpen: true }),

    closePublishConfirm: () => set({ isPublishConfirmModalOpen: false }),

    // Action handlers
    handleSave: async (status: 'DRAFT' | 'PUBLISHED') => {
      const state = get();
      if (state.invalidIncludes.size > 0 || state.notExistingIncludes.size > 0) {
        toast.error('Invalid includes or missing includes, please fix them before saving');
        return;
      }

      const operationType = status === 'PUBLISHED' ? 'PUBLISH' : 'SAVE';
      set({
        isSaving: operationType === 'SAVE',
        isPublishing: operationType === 'PUBLISH',
        operationError: null,
      });

      const options: UpdatePromptVersionOptions = {
        projectUuid: deps.selectedProjectUuid,
        promptVersionUuid: state.currentVersion.uuid,
        content: state.editorContent,
        config: state.editorConfig,
        status,
        variables: state.editorVariables.map((v) => ({
          ...v,
          default_value: v.default_value ?? null,
        })),
        includes: state.includedPrompts.map((ip) => ({
          arg: `${ip.prompt_versions.prompts.slug}:${ip.prompt_versions.version}`,
          slug: ip.prompt_versions.prompts.slug,
          version: ip.prompt_versions.version,
        })),
        pvChatPrompts: state.editorPvChatPrompts,
      };

      try {
        const response = await updatePromptVersion(options);
        if (response.success) {
          const successMessage =
            operationType === 'PUBLISH'
              ? 'Prompt published successfully!'
              : 'Prompt saved successfully!';

          toast.success(successMessage);

          set((state) => ({
            currentVersion: {
              ...state.currentVersion,
              status: status,
            },
            isSaving: false,
            isPublishing: false,
            isPublishConfirmModalOpen: false,
            hasChanges: false,
          }));

          deps.showSyncTooltip();
        } else {
          const message = response.message || 'An unknown error occurred';
          toast.error(message);
          set({ isSaving: false, isPublishing: false, operationError: message });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        toast.error(message);
        set({ isSaving: false, isPublishing: false, operationError: message });
      }
    },

    handleCreateNewVersion: async (options) => {
      set({ isCreatingVersion: true, operationError: null });

      const { versionType, customVersion, fromVersionUuid } = options;
      const state = get();

      try {
        const response = await createDraftVersion({
          promptId: state.prompt.id,
          latestVersion: state.latestVersion.version,
          versionType,
          customVersion,
          fromVersionUuid,
        });

        if (response.success && response.data) {
          const supabase = createClient();
          const promptsService = new PromptsService({ supabase });
          const newVersion = await promptsService.getPromptVersionByUuid(response.data.versionUuid);

          if (newVersion) {
            toast.success('New version created successfully');
            deps.router.push(
              routes.studio.editPromptVersion(deps.selectedProjectUuid, newVersion.uuid),
            );

            set((state) => ({
              isCreatingVersion: false,
              isCreateVersionModalOpen: false,
              allVersions: [...state.allVersions, newVersion],
              currentVersion: newVersion,
              hasChanges: false,
            }));
          } else {
            throw new Error('Failed to fetch new version data');
          }
        } else {
          const message = response.message || 'An unknown error occurred';
          toast.error(message);
          set({ isCreatingVersion: false, operationError: message });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        toast.error(message);
        set({ isCreatingVersion: false, operationError: message });
      }
    },

    setInputVariables: (variables) => {
      set((state) => {
        const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
          state.mergedIncludedVariables,
          variables,
        );

        const newState = {
          ...state,
          inputVariables: variables,
          missingRequiredVariables,
          variablesWithDefaults,
        };

        return {
          ...newState,
          compiledPrompt: _compilePrompt(newState),
          compiledMessages: _compileMessages(newState),
        };
      });
    },

    updateEditorVariables: (variables) => {
      const state = get();
      // Only update if variables are different
      if (JSON.stringify(variables) === JSON.stringify(state.editorVariables)) {
        return;
      }

      set((state) => {
        const mergedIncludedVariables = mergeIncludedVariables({
          variables,
          includedPromptVariables: state.includedPrompts.flatMap(
            (ip) => ip.prompt_versions.prompt_variables,
          ),
        });
        const { variablesWithDefaults } = validateVariables(mergedIncludedVariables, {});

        const newState = {
          ...state,
          editorVariables: variables,
          mergedIncludedVariables,
          inputVariables: variablesWithDefaults,
          hasChanges: true,
        };

        return {
          ...newState,
          compiledPrompt: _compilePrompt(newState),
          compiledMessages: _compileMessages(newState),
        };
      });
    },

    updateEditorContent: (content) => {
      set((state) => {
        const { missingGlobalContext } = validateGlobalContext(content, state.globalContext);

        const nextMissingGlobals = isEqual(missingGlobalContext, state.missingGlobals)
          ? state.missingGlobals
          : missingGlobalContext;

        const newState = {
          ...state,
          editorContent: content,
          missingGlobals: nextMissingGlobals,
          hasChanges: true,
        };

        return {
          ...newState,
          compiledPrompt: _compilePrompt(newState),
          compiledMessages: _compileMessages(newState),
        };
      });
    },

    updateEditorConfig: (config) => {
      set({ editorConfig: config, hasChanges: true });
    },

    updateIncludes: async (includes) => {
      if (!deps.selectedProject) return;
      const supabase = createClient();

      const promptsService = new PromptsService({ supabase });
      const resolvedIncludes = await promptsService.resolveParsedIncludes({
        projectId: deps.selectedProject.id,
        parsedIncludes: includes,
      });

      if (resolvedIncludes?.includedPrompts) {
        set((state) => {
          const mergedIncludedVariables = mergeIncludedVariables({
            variables: state.editorVariables,
            includedPromptVariables: resolvedIncludes.includedPrompts.flatMap(
              (ip) => ip.prompt_versions.prompt_variables,
            ),
          });
          const newState = {
            ...state,
            includedPrompts: resolvedIncludes.includedPrompts,
            mergedIncludedVariables,
          };
          return {
            ...newState,
            compiledPrompt: _compilePrompt(newState),
            compiledMessages: _compileMessages(newState),
          };
        });
      }

      if (resolvedIncludes?.invalidIncludes) {
        set({ invalidIncludes: resolvedIncludes.invalidIncludes });
      }

      if (resolvedIncludes?.notExistingIncludes) {
        set({ notExistingIncludes: resolvedIncludes.notExistingIncludes });
      }
    },

    updateEditorPvChatPromptContent: (index, content) => {
      set((state) => {
        const newEditorPvChatPrompts = [...state.editorPvChatPrompts];
        newEditorPvChatPrompts[index].content = content;

        const allMissingGlobalContext = newEditorPvChatPrompts.flatMap((pvChatPrompt) => {
          const { missingGlobalContext } = validateGlobalContext(
            pvChatPrompt.content ?? '',
            state.globalContext as Record<string, any>,
          );
          return missingGlobalContext;
        });

        const nextMissingGlobals = isEqual(allMissingGlobalContext, state.missingGlobals)
          ? state.missingGlobals
          : allMissingGlobalContext;

        const newState = {
          ...state,
          editorPvChatPrompts: newEditorPvChatPrompts,
          missingGlobals: nextMissingGlobals,
          hasChanges: true,
        };

        return {
          ...newState,
          compiledMessages: _compileMessages(newState),
        };
      });
    },

    addEditorPvChatPrompt: (options) => {
      set((state) => {
        const newEditorPvChatPrompts =
          options.index !== undefined
            ? [
                ...state.editorPvChatPrompts.slice(0, options.index),
                { role: options.role, content: options.content ?? '' },
                ...state.editorPvChatPrompts.slice(options.index),
              ]
            : [
                ...state.editorPvChatPrompts,
                { role: options.role, content: options.content ?? '' },
              ];

        const newState = {
          ...state,
          editorPvChatPrompts: newEditorPvChatPrompts,
          hasChanges: true,
        };

        return {
          ...newState,
          compiledMessages: _compileMessages(newState),
        };
      });
    },

    removeEditorPvChatPrompt: (index) => {
      set((state) => {
        const newEditorPvChatPrompts = state.editorPvChatPrompts.filter((_, i) => i !== index);

        const newState = {
          ...state,
          editorPvChatPrompts: newEditorPvChatPrompts,
          hasChanges: newEditorPvChatPrompts.length > 0,
        };

        return {
          ...newState,
          compiledMessages: _compileMessages(newState),
        };
      });
    },
  }));
};
