import { usePromptPage } from '@/providers/prompt-page';
import { ExternalLink } from 'lucide-react';
import { PromptContentEditor } from '../editors/prompt-editor';
import { ParsedVariable } from '@/utils/template-utils';

export const NonChatPromptEditor = () => {
  const { state, updateEditorContent, updateEditorVariables, updateIncludes } = usePromptPage();

  const onVariablesChange = (parsedVariables: ParsedVariable[]) => {
    const newVariables = parsedVariables.map((v) => {
      const existingVariable = editorVariables.find((ev) => ev.name === v.name);
      if (existingVariable) return existingVariable;

      return {
        name: v.name,
        type: v.type,
        required: true,
        default_value: null,
      };
    });
    updateEditorVariables(newVariables);
  };

  const { editorContent, editorVariables } = state;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-2">
          Content
          <span className="text-xs">
            Agentsmith uses the Jinja templating language.{' '}
            <a
              className="inline-flex items-center gap-1 underline text-primary"
              href="/docs/prompt-authoring"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn More
              <ExternalLink size={12} />
            </a>
          </span>
        </div>
        {/* <EmojiModeButton onEnabledChange={() => {}} onEmojiListLoaded={() => {}} /> */}
      </div>
      <PromptContentEditor
        content={editorContent}
        readOnly={false}
        onContentChange={updateEditorContent}
        onVariablesChange={onVariablesChange}
        onIncludesChange={updateIncludes}
        minHeight="500px"
      />
    </div>
  );
};
