'use client';

import { createContext, useContext, useRef, ReactNode } from 'react';
import { useStore } from 'zustand';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/app';
import { compareSemanticVersions } from '@/utils/versioning';
import { mergeIncludedVariables } from '@/utils/merge-included-variables';
import { validateVariables } from '@/utils/template-utils';
import { createPromptPageStore, PromptPageStore, PromptPageState } from './prompt-page.store';
import { EditorPromptPvChatPrompt, GetAllPromptsDataResult } from '@/lib/PromptsService';

type PromptData = NonNullable<GetAllPromptsDataResult>[0];
type PromptVersion = PromptData['prompt_versions'][0];
type StoreType = ReturnType<typeof createPromptPageStore>;

const PromptPageStoreContext = createContext<StoreType | null>(null);

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

  const storeRef = useRef<StoreType | null>(null);

  if (!storeRef.current) {
    // Build initial state (same as before)
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

    const editorPvChatPrompts =
      currentVersion.pv_chat_prompts.length > 0
        ? (currentVersion.pv_chat_prompts as EditorPromptPvChatPrompt[])
        : [
            {
              role: 'system' as const,
              content: 'You are a helpful assistant.',
            },
          ];

    const initialState: PromptPageState = {
      prompt,
      allVersions: sortedVersions,
      latestVersion,
      currentVersion,
      mode,
      includedPrompts: currentVersion.prompt_includes,
      mergedIncludedVariables,
      notExistingIncludes: new Set(),
      invalidIncludes: new Set(),
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
      compiledMessages: [],
      inputVariables: variablesWithDefaults,
      editorVariables: currentVersion.prompt_variables,
      editorContent: currentVersion.content,
      editorConfig: currentVersion.config as any,
      editorPvChatPrompts,
    };

    // Create store with dependencies
    storeRef.current = createPromptPageStore(initialState, {
      router,
      selectedProjectUuid,
      selectedProject,
      showSyncTooltip,
    });
  }

  return (
    <PromptPageStoreContext.Provider value={storeRef.current}>
      {children}
    </PromptPageStoreContext.Provider>
  );
};

// Main hook with selector support
export const usePromptPage = <T,>(selector: (state: PromptPageStore) => T): T => {
  const store = useContext(PromptPageStoreContext);

  if (!store) {
    throw new Error('usePromptPage must be used within a PromptPageProvider');
  }

  return useStore(store, selector);
};
