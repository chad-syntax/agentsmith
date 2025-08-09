import { usePromptPage } from '@/providers/prompt-page';
import { ParsedInclude, ParsedVariable } from '@/utils/template-utils';
import { capitalize } from '@/utils/capitalize';
import { Button } from '@/components/ui/button';
import { PromptContentEditor } from '@/components/editors/prompt-editor';
import { useRef } from 'react';
import { ExternalLink, Info, Plus, X } from 'lucide-react';

type AddMessageButtonProps = {
  role: 'system' | 'user' | 'assistant';
  index?: number;
};

const AddMessageButton = (props: AddMessageButtonProps) => {
  const { addEditorPvChatPrompt } = usePromptPage();
  const { role, index } = props;
  return (
    <Button
      className="w-full border gap-1 border-muted-foreground/50 hover:border-muted-foreground bg-muted/50 text-muted-foreground/70 hover:text-muted-foreground border-dashed"
      variant="outline"
      size="lg"
      onClick={() => addEditorPvChatPrompt({ role, index })}
    >
      <Plus />
      {capitalize(role)}
    </Button>
  );
};

export const ChatPromptsEditor = () => {
  const {
    state,
    updateEditorVariables,
    updateIncludes,
    updateEditorPvChatPromptContent,
    removeEditorPvChatPrompt,
  } = usePromptPage();

  const { editorVariables, editorPvChatPrompts } = state;

  const pvChatPromptVariablesRef = useRef<Record<string, ParsedVariable[]>>({});

  const pvChatPromptIncludesRef = useRef<Record<string, ParsedInclude[]>>({});

  const onVariablesChange = (index: number, variables: ParsedVariable[]) => {
    const newPvChatPromptVariables: Record<string, ParsedVariable[]> = {
      ...pvChatPromptVariablesRef.current,
      [index]: variables,
    };

    pvChatPromptVariablesRef.current = newPvChatPromptVariables;

    // collapse all variables from all pv chat prompts to send update to context
    const allPvChatPromptVariables = Object.values(newPvChatPromptVariables).flat();

    const reducedPvChatPromptVariables = allPvChatPromptVariables.reduce(
      (acc, v) => (acc.some((a) => a.name === v.name) ? acc : [...acc, v]),
      [] as ParsedVariable[],
    );

    const newVariables = reducedPvChatPromptVariables.map((v) => {
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

  const onIncludesChange = (index: number, includes: ParsedInclude[]) => {
    pvChatPromptIncludesRef.current = {
      ...pvChatPromptIncludesRef.current,
      [index]: includes,
    };

    // collapse all includes from all pv chat prompts
    const allIncludes = Object.values(pvChatPromptIncludesRef.current).flat();
    updateIncludes(allIncludes);
  };

  const handleRemovePvChatPrompt = (index: number) => {
    // take all variables and includes from the pv chat prompt and remove them from the ref and then dispatch updates

    onVariablesChange(index, []);
    onIncludesChange(index, []);

    removeEditorPvChatPrompt(index);
  };

  const firstRole = editorPvChatPrompts.at(0)?.role;
  const lastRole = editorPvChatPrompts.at(-1)?.role;

  return (
    <div className="space-y-4">
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
      {firstRole === 'user' ? (
        <AddMessageButton role="system" index={0} />
      ) : firstRole !== 'system' ? (
        <div className="grid grid-cols-2 gap-4">
          <AddMessageButton role="system" index={0} />
          <AddMessageButton role="user" index={0} />
        </div>
      ) : null}
      {editorPvChatPrompts.length === 0 && (
        <div className="text-center p-6 border border-muted-foreground bg-muted rounded flex items-center justify-center gap-2">
          <Info className="size-4" />
          You must have at least one chat prompt
        </div>
      )}
      {editorPvChatPrompts.map((pvChatPrompt, index) => (
        <div key={`${pvChatPrompt.role}-${index}`}>
          <div className="flex justify-between items-center">
            <div className="text-md ml-2">{capitalize(pvChatPrompt.role)}</div>
            <Button
              className="text-destructive hover:text-destructive"
              variant="ghost"
              size="icon"
              onClick={() => handleRemovePvChatPrompt(index)}
            >
              <X />
            </Button>
          </div>
          <div className="space-y-4">
            <PromptContentEditor
              content={pvChatPrompt.content ?? ''}
              readOnly={false}
              onContentChange={(content) => updateEditorPvChatPromptContent(index, content)}
              onVariablesChange={(variables) => onVariablesChange(index, variables)}
              onIncludesChange={(includes) => onIncludesChange(index, includes)}
              minHeight="200px"
            />
            {pvChatPrompt.role === 'system' &&
              editorPvChatPrompts.at(index + 1)?.role === 'assistant' && (
                <AddMessageButton role="user" index={index + 1} />
              )}
          </div>
        </div>
      ))}
      {lastRole === 'system' || lastRole === 'assistant' ? (
        <AddMessageButton role="user" />
      ) : lastRole !== undefined ? (
        <AddMessageButton role="assistant" />
      ) : null}
    </div>
  );
};
