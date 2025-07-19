'use client';

import { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import { EditorPromptVariable, IncludedPrompt } from '@/types/prompt-editor';
import { GetAllPromptsDataResult, UpdatePromptVersionOptions } from '@/lib/PromptsService';
import { useCallback } from 'react';
import { compareSemanticVersions } from '@/utils/versioning';
import { createDraftVersion, updatePromptVersion } from '@/app/actions/prompts';
import { toast } from 'sonner';
import { useApp } from '@/providers/app';
import { createClient } from '@/lib/supabase/client';
import { PromptsService } from '@/lib/PromptsService';
import { mergeIncludedVariables } from '@/utils/merge-included-variables';
import {
  compilePrompt,
  ParsedInclude,
  validateGlobalContext,
  validateVariables,
} from '@/utils/template-utils';
import { makePromptLoader } from '@/utils/make-prompt-loader';
import { useRouter } from 'next/navigation';
import { routes } from '@/utils/routes';
import { CompletionConfig } from '@/lib/openrouter';

type PromptData = NonNullable<GetAllPromptsDataResult>[0];
type PromptVersion = PromptData['prompt_versions'][0];

type PromptPageState = {
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

  // Derived/UI State
  includedPrompts: IncludedPrompt[];
  mergedIncludedVariables: EditorPromptVariable[];
  notExistingIncludes: Set<string>;
  missingGlobals: string[];
  missingRequiredVariables: EditorPromptVariable[];
  variablesWithDefaults: Record<string, string | number | boolean | object>;
  compiledPrompt: string;

  // Status Flags
  isSaving: boolean;
  isCreatingVersion: boolean;
  isPublishing: boolean;
  operationError: string | null;
  hasChanges: boolean; // Tracks unsaved changes on the edit page
  mode: 'view' | 'edit'; // Distinguishes between detail and edit pages

  // Modal Visibility
  isTestModalOpen: boolean;
  isCompileToClipboardModalOpen: boolean;
  isCreateVersionModalOpen: boolean;
  isPublishConfirmModalOpen: boolean;
};

type OperationType = 'SAVE' | 'CREATE_VERSION' | 'PUBLISH';

// Define specific success payloads for each operation type
type SaveOperationSuccessPayload = {
  operationType: 'SAVE' | 'PUBLISH';
};

type CreateVersionOperationSuccessPayload = {
  operationType: 'CREATE_VERSION';
  newVersion: PromptVersion;
};

// Union of all possible success payloads
type OperationSuccessPayload = SaveOperationSuccessPayload | CreateVersionOperationSuccessPayload;

type ModalType = 'test' | 'compileToClipboard' | 'createVersion' | 'publishConfirm';

type Action =
  | {
      type: 'SET_INITIAL_DATA';
      payload: {
        prompt: PromptData;
        versions: PromptVersion[];
        mode: 'view' | 'edit';
        currentVersionUuid?: string;
        globalContext: Record<string, any>;
      };
    }
  | { type: 'SET_CURRENT_VERSION_BY_UUID'; payload: { versionUuid: string } }
  | { type: 'SET_INPUT_VARIABLES'; payload: Record<string, string | number | boolean | object> }
  | { type: 'UPDATE_FIELD'; payload: { field: 'content' | 'config'; value: any } }
  | { type: 'UPDATE_EDITOR_VARIABLES'; payload: EditorPromptVariable[] }
  | { type: 'UPDATE_INCLUDES'; payload: IncludedPrompt[] }
  | { type: 'UPDATE_EDITOR_CONTENT'; payload: string }
  | { type: 'UPDATE_EDITOR_CONFIG'; payload: CompletionConfig }
  | { type: 'UPDATE_NOT_EXISTING_INCLUDES'; payload: Set<string> }
  | {
      type: 'OPERATION_START';
      payload: {
        operationType: OperationType;
        afterAction?: {
          type: 'OPEN_MODAL';
          payload: 'test' | 'compileToClipboard' | 'createVersion' | 'publishConfirm';
        };
      };
    }
  | { type: 'OPERATION_SUCCESS'; payload: OperationSuccessPayload }
  | {
      type: 'OPERATION_ERROR';
      payload: { operationType: OperationType; error: string };
    }
  | {
      type: 'OPEN_MODAL';
      payload: { modalType: ModalType };
    }
  | {
      type: 'CLOSE_MODAL';
      payload: { modalType: ModalType };
    };

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
    // TODO: add template error to state so we can stop users from saving/publishing
    // with invalid templates, for now just return the previous compiled prompt
    return state.compiledPrompt;
  }
};

const promptPageReducer = (state: PromptPageState, action: Action): PromptPageState => {
  switch (action.type) {
    case 'SET_INITIAL_DATA': {
      const { prompt, versions, mode, currentVersionUuid, globalContext } = action.payload;
      const sortedVersions = [...versions].sort((a, b) =>
        compareSemanticVersions(b.version, a.version),
      );
      const latestVersion = sortedVersions[0];
      const currentVersion =
        mode === 'edit' && currentVersionUuid
          ? sortedVersions.find((v) => v.uuid === currentVersionUuid) || latestVersion
          : latestVersion;

      const variables = currentVersion.prompt_variables;
      const includedPrompts = currentVersion.prompt_includes;
      const includedPromptVariables = includedPrompts.flatMap(
        (ip) => ip.prompt_versions.prompt_variables,
      );
      const mergedIncludedVariables = mergeIncludedVariables({
        variables,
        includedPromptVariables,
      });

      const { missingGlobalContext } = validateGlobalContext(currentVersion.content, globalContext);

      const editorContent = currentVersion.content;
      const editorConfig = currentVersion.config as CompletionConfig;

      return {
        ...state,
        prompt,
        allVersions: sortedVersions,
        latestVersion,
        currentVersion,
        mode,
        editorContent,
        editorConfig,
        editorVariables: currentVersion.prompt_variables,
        mergedIncludedVariables,
        missingGlobals: missingGlobalContext,
        hasChanges: false,
        operationError: null,
      };
    }
    case 'SET_CURRENT_VERSION_BY_UUID': {
      const { versionUuid } = action.payload;
      const newCurrentVersion = state.allVersions.find((v) => v.uuid === versionUuid);
      if (!newCurrentVersion) return state;
      return {
        ...state,
        currentVersion: newCurrentVersion,
      };
    }
    case 'SET_INPUT_VARIABLES': {
      const inputVariables = action.payload;

      const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
        state.mergedIncludedVariables,
        inputVariables,
      );

      const beforeCompileState = {
        ...state,
        inputVariables,
        missingRequiredVariables,
        variablesWithDefaults,
      };

      const compiledPrompt = _compilePrompt(beforeCompileState);

      return {
        ...beforeCompileState,
        compiledPrompt,
      };
    }
    case 'UPDATE_FIELD': {
      const { field, value } = action.payload;
      return {
        ...state,
        currentVersion: { ...state.currentVersion, [field]: value },
        hasChanges: true,
      };
    }
    case 'UPDATE_EDITOR_VARIABLES': {
      const compiledPrompt = _compilePrompt({ ...state, editorVariables: action.payload });
      const mergedIncludedVariables = mergeIncludedVariables({
        variables: action.payload,
        includedPromptVariables: state.includedPrompts.flatMap(
          (ip) => ip.prompt_versions.prompt_variables,
        ),
      });
      const { variablesWithDefaults } = validateVariables(mergedIncludedVariables, {});
      return {
        ...state,
        compiledPrompt,
        editorVariables: action.payload,
        mergedIncludedVariables,
        inputVariables: variablesWithDefaults,
        hasChanges: true,
      };
    }
    case 'UPDATE_EDITOR_CONTENT': {
      const compiledPrompt = _compilePrompt({ ...state, editorContent: action.payload });
      const { missingGlobalContext } = validateGlobalContext(action.payload, state.globalContext);

      return {
        ...state,
        compiledPrompt,
        editorContent: action.payload,
        missingGlobals: missingGlobalContext,
        hasChanges: true,
      };
    }
    case 'UPDATE_EDITOR_CONFIG': {
      return { ...state, editorConfig: action.payload, hasChanges: true };
    }
    case 'UPDATE_NOT_EXISTING_INCLUDES': {
      return { ...state, notExistingIncludes: action.payload };
    }
    case 'UPDATE_INCLUDES': {
      const mergedIncludedVariables = mergeIncludedVariables({
        variables: state.editorVariables,
        includedPromptVariables: action.payload.flatMap(
          (ip) => ip.prompt_versions.prompt_variables,
        ),
      });
      return { ...state, includedPrompts: action.payload, mergedIncludedVariables };
    }
    case 'OPERATION_START': {
      const { operationType } = action.payload;
      const isPublishing = operationType === 'PUBLISH';
      const isCreatingVersion = operationType === 'CREATE_VERSION';
      return {
        ...state,
        isSaving: !isPublishing && !isCreatingVersion,
        isPublishing,
        isCreatingVersion,
        operationError: null,
      };
    }
    case 'OPERATION_SUCCESS': {
      const { operationType } = action.payload;
      if (operationType === 'CREATE_VERSION') {
        const { newVersion } = action.payload as CreateVersionOperationSuccessPayload;
        const allVersions = [...state.allVersions, newVersion];

        return {
          ...state,
          isCreatingVersion: false,
          isCreateVersionModalOpen: false,
          allVersions,
          currentVersion: newVersion,
          hasChanges: false,
        };
      }

      if (operationType === 'PUBLISH') {
        return {
          ...state,
          currentVersion: {
            ...state.currentVersion,
            status: 'PUBLISHED',
          },
          isPublishing: false,
          isPublishConfirmModalOpen: false,
          isSaving: false,
          hasChanges: false,
        };
      }

      if (operationType === 'SAVE') {
        return {
          ...state,
          currentVersion: {
            ...state.currentVersion,
            status: 'DRAFT',
          },
          isSaving: false,
          hasChanges: false,
        };
      }

      return {
        ...state,
        isPublishConfirmModalOpen: false,
        isSaving: false,
        isPublishing: false,
        hasChanges: false,
      };
    }
    case 'OPERATION_ERROR': {
      return {
        ...state,
        isSaving: false,
        isCreatingVersion: false,
        isPublishing: false,
        operationError: action.payload.error,
      };
    }
    case 'OPEN_MODAL': {
      const { modalType } = action.payload;
      const baseNewState = { ...state, [`is${capitalize(modalType)}ModalOpen`]: true };
      if (modalType === 'compileToClipboard' || modalType === 'test') {
        const compiledPrompt = _compilePrompt(baseNewState);
        const { variablesWithDefaults } = validateVariables(state.mergedIncludedVariables, {});
        return { ...baseNewState, inputVariables: variablesWithDefaults, compiledPrompt };
      }
      return baseNewState;
    }
    case 'CLOSE_MODAL': {
      const { modalType } = action.payload;
      const baseNewState = { ...state, [`is${capitalize(modalType)}ModalOpen`]: false };
      if (modalType === 'compileToClipboard' || modalType === 'test') {
        const { variablesWithDefaults } = validateVariables(state.mergedIncludedVariables, {});
        return { ...baseNewState, inputVariables: variablesWithDefaults };
      }
      return baseNewState;
    }
    default:
      return state;
  }
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type PromptPageContextType = {
  state: PromptPageState;
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
  handleCreateNewVersion: (
    versionType: 'major' | 'minor' | 'patch',
    customVersion?: string,
  ) => Promise<void>;
  setInputVariables: (variables: Record<string, string | number | boolean | object>) => void;
  updateIncludes: (includes: ParsedInclude[]) => void;
  updateEditorVariables: (variables: EditorPromptVariable[]) => void;
  updateEditorContent: (content: string) => void;
  updateEditorConfig: (config: CompletionConfig) => void;
};

export const PromptPageContext = createContext<PromptPageContextType | undefined>(undefined);

type PromptPageProviderProps = {
  children: ReactNode;
  prompt: PromptData;
  versions: PromptVersion[];
  mode: 'view' | 'edit';
  currentVersionUuid?: string;
  globalContext: Record<string, any>;
};

export const PromptPageProvider = (props: PromptPageProviderProps) => {
  const { children, prompt, versions, mode, currentVersionUuid, globalContext } = props;
  const { selectedProjectUuid, selectedProject, showSyncTooltip } = useApp();
  const router = useRouter();

  const sortedVersions = [...versions].sort((a, b) =>
    compareSemanticVersions(b.version, a.version),
  );
  const latestVersion = sortedVersions[0];
  const currentVersion =
    mode === 'edit' && currentVersionUuid
      ? sortedVersions.find((v) => v.uuid === currentVersionUuid) || latestVersion
      : latestVersion;

  const mergedIncludedVariables = mergeIncludedVariables({
    variables: currentVersion.prompt_variables,
    includedPromptVariables: currentVersion.prompt_includes.flatMap(
      (ip) => ip.prompt_versions.prompt_variables,
    ),
  });

  const { variablesWithDefaults } = validateVariables(mergedIncludedVariables, {});

  const initialState: PromptPageState = {
    prompt,
    allVersions: sortedVersions,
    latestVersion,
    currentVersion,
    mode,
    includedPrompts: currentVersion.prompt_includes,
    mergedIncludedVariables,
    notExistingIncludes: new Set(),
    missingGlobals: [],
    missingRequiredVariables: [],
    variablesWithDefaults,
    isSaving: false,
    isCreatingVersion: false,
    isPublishing: false,
    operationError: null,
    hasChanges: false,
    isTestModalOpen: false,
    isCompileToClipboardModalOpen: false,
    isCreateVersionModalOpen: false,
    isPublishConfirmModalOpen: false,
    globalContext,
    compiledPrompt: '',
    inputVariables: variablesWithDefaults,
    editorVariables: currentVersion.prompt_variables,
    editorContent: currentVersion.content,
    editorConfig: currentVersion.config as CompletionConfig,
  };

  const [state, dispatch] = useReducer(promptPageReducer, initialState);

  const openTestModal = () => {
    if (state.hasChanges) {
      if (state.currentVersion.status === 'DRAFT') {
        handleSave('DRAFT').then(() => {
          dispatch({ type: 'OPEN_MODAL', payload: { modalType: 'test' } });
        });
        return;
      }
      if (state.currentVersion.status === 'PUBLISHED') {
        openPublishConfirm();
        return;
      }
    }
    dispatch({ type: 'OPEN_MODAL', payload: { modalType: 'test' } });
  };
  const closeTestModal = () => dispatch({ type: 'CLOSE_MODAL', payload: { modalType: 'test' } });
  const openCompileToClipboardModal = () =>
    dispatch({ type: 'OPEN_MODAL', payload: { modalType: 'compileToClipboard' } });
  const closeCompileToClipboardModal = () =>
    dispatch({ type: 'CLOSE_MODAL', payload: { modalType: 'compileToClipboard' } });
  const openCreateVersionModal = () =>
    dispatch({ type: 'OPEN_MODAL', payload: { modalType: 'createVersion' } });
  const closeCreateVersionModal = () =>
    dispatch({ type: 'CLOSE_MODAL', payload: { modalType: 'createVersion' } });
  const openPublishConfirm = () =>
    dispatch({ type: 'OPEN_MODAL', payload: { modalType: 'publishConfirm' } });
  const closePublishConfirm = () =>
    dispatch({ type: 'CLOSE_MODAL', payload: { modalType: 'publishConfirm' } });

  const handleSave = useCallback(
    async (status: 'DRAFT' | 'PUBLISHED') => {
      const operationType = status === 'PUBLISHED' ? 'PUBLISH' : 'SAVE';
      dispatch({
        type: 'OPERATION_START',
        payload: { operationType },
      });

      const options: UpdatePromptVersionOptions = {
        projectUuid: selectedProjectUuid,
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
      };

      try {
        const response = await updatePromptVersion(options);
        if (response.success) {
          const successMessage =
            operationType === 'PUBLISH'
              ? 'Prompt published successfully!'
              : 'Prompt saved successfully!';

          toast.success(successMessage);
          dispatch({
            type: 'OPERATION_SUCCESS',
            payload: { operationType },
          });
          showSyncTooltip();
        } else {
          const message = response.message || 'An unknown error occurred';
          toast.error(message);
          dispatch({ type: 'OPERATION_ERROR', payload: { operationType, error: message } });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        toast.error(message);
        dispatch({ type: 'OPERATION_ERROR', payload: { operationType, error: message } });
      }
    },
    [state, selectedProjectUuid],
  );

  const handleCreateNewVersion = useCallback(
    async (versionType: 'major' | 'minor' | 'patch', customVersion?: string) => {
      dispatch({ type: 'OPERATION_START', payload: { operationType: 'CREATE_VERSION' } });

      try {
        const response = await createDraftVersion({
          promptId: state.prompt.id,
          latestVersion: state.latestVersion.version,
          versionType,
          customVersion,
        });

        if (response.success && response.data) {
          const supabase = createClient();
          const promptsService = new PromptsService({ supabase });
          const newVersion = await promptsService.getPromptVersionByUuid(response.data.versionUuid);

          if (newVersion) {
            toast.success('New version created successfully');
            router.push(routes.studio.editPromptVersion(selectedProjectUuid, newVersion.uuid));
            dispatch({
              type: 'OPERATION_SUCCESS',
              payload: { operationType: 'CREATE_VERSION', newVersion },
            });
          } else {
            throw new Error('Failed to fetch new version data');
          }
        } else {
          const message = response.message || 'An unknown error occurred';
          toast.error(message);
          dispatch({
            type: 'OPERATION_ERROR',
            payload: { operationType: 'CREATE_VERSION', error: message },
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        toast.error(message);
        dispatch({
          type: 'OPERATION_ERROR',
          payload: { operationType: 'CREATE_VERSION', error: message },
        });
      }
    },
    [state],
  );

  const setInputVariables = (variables: Record<string, string | number | boolean | object>) => {
    dispatch({ type: 'SET_INPUT_VARIABLES', payload: variables });
  };

  const updateEditorVariables = (variables: EditorPromptVariable[]) => {
    // only dispatch if the variables are different
    if (JSON.stringify(variables) === JSON.stringify(state.editorVariables)) {
      return;
    }

    dispatch({ type: 'UPDATE_EDITOR_VARIABLES', payload: variables });
  };

  const updateEditorContent = (content: string) => {
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: content });
  };

  const updateEditorConfig = (config: CompletionConfig) => {
    dispatch({ type: 'UPDATE_EDITOR_CONFIG', payload: config });
  };

  const updateIncludes = async (includes: ParsedInclude[]) => {
    const supabase = createClient();

    const promptsService = new PromptsService({ supabase });
    const resolvedIncludes = await promptsService.resolveParsedIncludes({
      projectId: selectedProject.id,
      parsedIncludes: includes,
    });

    if (resolvedIncludes?.includedPrompts) {
      dispatch({ type: 'UPDATE_INCLUDES', payload: resolvedIncludes.includedPrompts });
    }

    if (resolvedIncludes?.notExistingIncludes) {
      dispatch({
        type: 'UPDATE_NOT_EXISTING_INCLUDES',
        payload: resolvedIncludes.notExistingIncludes,
      });
    }
  };

  const value: PromptPageContextType = {
    state,
    openTestModal,
    closeTestModal,
    openCompileToClipboardModal,
    closeCompileToClipboardModal,
    openCreateVersionModal,
    closeCreateVersionModal,
    openPublishConfirm,
    closePublishConfirm,
    handleSave,
    handleCreateNewVersion,
    setInputVariables,
    updateEditorVariables,
    updateEditorContent,
    updateEditorConfig,
    updateIncludes,
  };

  return <PromptPageContext.Provider value={value}>{children}</PromptPageContext.Provider>;
};

export const usePromptPage = () => {
  const context = useContext(PromptPageContext);
  if (!context) {
    throw new Error('usePromptPage must be used within a PromptPageProvider');
  }
  return context;
};
