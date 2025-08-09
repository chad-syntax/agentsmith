import { usePromptPage } from '@/providers/prompt-page';
import { useState } from 'react';
import { JsonConfigEditorModal } from '../modals/json-config-editor';
import { Button } from '../ui/button';
import { ModelSelect } from './model-select';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/utils/shadcn';
import { BrainCircuit } from 'lucide-react';

type PromptConfigEditorProps = {
  readOnly?: boolean;
};

export const PromptConfigEditor = (props: PromptConfigEditorProps) => {
  const { readOnly } = props;

  const { state, updateEditorConfig } = usePromptPage();
  const [isJsonConfigEditorOpen, setIsJsonConfigEditorOpen] = useState(false);
  const [temperatureEnabled, setTemperatureEnabled] = useState(false);

  return (
    <>
      <JsonConfigEditorModal
        isOpen={isJsonConfigEditorOpen}
        onOpenChange={() => setIsJsonConfigEditorOpen(false)}
      />
      <div className="space-y-4">
        <ModelSelect readOnly={readOnly} />
        <div className="flex items-center gap-2">
          <Label className={cn(readOnly ? 'text-muted-foreground/60' : 'cursor-pointer')}>
            Stream
          </Label>
          <Switch
            id="stream"
            disabled={readOnly}
            checked={state.editorConfig.stream}
            onCheckedChange={(checked) =>
              updateEditorConfig({
                ...state.editorConfig,
                stream: checked === true ? checked : undefined,
              })
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="temperature"
            checked={temperatureEnabled}
            onCheckedChange={(checked) => {
              setTemperatureEnabled((p) => !p);
              updateEditorConfig({ ...state.editorConfig, temperature: checked ? 1 : undefined });
            }}
            className="cursor-pointer"
            disabled={readOnly}
          />
          <Label
            htmlFor="temperature"
            className={cn(
              (!temperatureEnabled || readOnly) && 'text-muted-foreground/60',
              !readOnly && 'cursor-pointer',
            )}
          >
            Temperature
          </Label>
          <Slider
            disabled={!temperatureEnabled}
            min={0}
            max={2}
            step={0.01}
            value={[state.editorConfig.temperature ?? 0]}
            onValueChange={(value) =>
              updateEditorConfig({ ...state.editorConfig, temperature: value[0] })
            }
          />
          <span
            className={cn(
              'text-sm min-w-[34px] text-center',
              !temperatureEnabled && 'text-muted-foreground',
            )}
          >
            {state.editorConfig.temperature ?? '-'}
          </span>
        </div>
        {!readOnly && (
          <div>
            <Button
              className="has-[>svg]:px-0 text-sm"
              variant="link"
              onClick={() => setIsJsonConfigEditorOpen(true)}
            >
              <BrainCircuit />
              Advanced
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
