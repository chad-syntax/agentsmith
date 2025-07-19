import { EditorPromptVariable } from '@/types/prompt-editor';

type MergeIncludedVariablesOptions = {
  variables: EditorPromptVariable[];
  includedPromptVariables: EditorPromptVariable[];
};

export const mergeIncludedVariables = (
  options: MergeIncludedVariablesOptions,
): EditorPromptVariable[] => {
  const { variables, includedPromptVariables } = options;
  const mergedVariables = new Map<string, EditorPromptVariable>();

  variables.forEach((variable) => {
    mergedVariables.set(variable.name, variable);
  });

  includedPromptVariables.forEach((variable) => {
    const existingVariable = mergedVariables.get(variable.name);
    if (!existingVariable) {
      mergedVariables.set(variable.name, variable);
    } else {
      if (!existingVariable.required && variable.required) {
        mergedVariables.set(variable.name, variable);
      }
    }
  });

  return Array.from(mergedVariables.values());
};
