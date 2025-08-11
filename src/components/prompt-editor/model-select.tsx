'use client';

import { Plus, RefreshCcw, X } from 'lucide-react';

import { usePromptPage } from '@/providers/prompt-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMediaQuery } from '@/hooks/use-media-query';
import { fetchOpenrouterModels, OpenrouterModel } from '@/lib/openrouter';
import { cn } from '@/utils/shadcn';
import { useEffect, useState } from 'react';

// Cache models across openings to avoid refetching
let cachedModels: OpenrouterModel[] | null = null;

type ModelPickerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelectModel: (modelId: string) => void;
  replacingModel: string | null;
};

const ModelPicker = (props: ModelPickerProps) => {
  const { open, setOpen, onSelectModel, replacingModel } = props;
  const [models, setModels] = useState<OpenrouterModel[]>(cachedModels ?? []);
  const [loading, setLoading] = useState(false);

  const selectedModels = usePromptPage((s) => s.editorConfig.models ?? []);

  useEffect(() => {
    if (!open) return;
    if (cachedModels) return;
    setLoading(true);
    fetchOpenrouterModels()
      .then((data) => {
        cachedModels = data;
        setModels(data);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const availableModels = models.filter((m) => {
    const isSelected = selectedModels.includes(m.id);
    if (replacingModel) return !isSelected || m.id === replacingModel;
    return !isSelected;
  });

  return (
    <Command>
      <CommandInput placeholder="Filter models..." />
      <CommandList>
        {loading ? (
          <CommandEmpty>Loading models...</CommandEmpty>
        ) : (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        <CommandGroup>
          {availableModels
            .filter((m) => m.id !== replacingModel)
            .map((model) => (
              <CommandItem
                key={model.id}
                value={model.id}
                keywords={[model.name, model.description]}
                onSelect={(value) => {
                  onSelectModel(value);
                  setOpen(false);
                }}
              >
                {model.name}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

type ModelSelectProps = {
  readOnly?: boolean;
};

export const ModelSelect = (props: ModelSelectProps) => {
  const { readOnly } = props;
  const models = usePromptPage((s) => s.editorConfig.models ?? []);
  const editorConfig = usePromptPage((s) => s.editorConfig);
  const updateEditorConfig = usePromptPage((s) => s.updateEditorConfig);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replacingModel, setReplacingModel] = useState<string | null>(null);

  const handleRemoveModel = (modelToRemove: string) => {
    if (models.length > 1) {
      const newModels = models.filter((model) => model !== modelToRemove);
      updateEditorConfig({ ...editorConfig, models: newModels });
    }
  };

  const handleReplaceModel = (oldModel: string, newModel: string) => {
    if (oldModel === newModel) return;

    const newModels = models.map((m) => (m === oldModel ? newModel : m));
    updateEditorConfig({ ...editorConfig, models: newModels });
  };

  const handleAddModel = (newModel: string) => {
    const selectedModels = editorConfig.models ?? [];
    if (selectedModels.length >= 3) return;
    if (selectedModels.includes(newModel)) return;
    updateEditorConfig({ ...editorConfig, models: [...selectedModels, newModel] });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {models.map((model, index) => {
          const onlyOneModel = models.length === 1;
          return (
            <Badge
              key={model}
              onClick={
                !readOnly
                  ? () => {
                      setReplacingModel(model);
                      setPickerOpen(true);
                    }
                  : undefined
              }
              className={cn('pl-2 max-w-full', !readOnly && 'cursor-pointer pr-1')}
              variant={index > 0 ? 'outline' : 'default'}
            >
              <span className="truncate">{model}</span>
              {!readOnly && (
                <button
                  onClick={
                    !onlyOneModel
                      ? (e) => {
                          e.stopPropagation();
                          handleRemoveModel(model);
                        }
                      : undefined
                  }
                  className={cn(
                    'cursor-pointer rounded-full p-0.5',
                    index > 0
                      ? 'text-foreground/50 hover:bg-foreground/20 hover:text-foreground'
                      : 'text-background/50 hover:text-background hover:bg-background/20',
                  )}
                  aria-label={`Remove ${model}`}
                >
                  {onlyOneModel ? <RefreshCcw className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </button>
              )}
            </Badge>
          );
        })}
        {models.length < 3 && !readOnly ? (
          <Popover open={isDesktop ? pickerOpen : false} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Badge
                onClick={() => {
                  setReplacingModel(null);
                  setPickerOpen(true);
                }}
                className="cursor-pointer pr-2 pl-1"
                variant="outline"
              >
                <Plus className="h-3 w-3" />
                Add Fallback Model
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <ModelPicker
                open={pickerOpen}
                setOpen={setPickerOpen}
                replacingModel={replacingModel}
                onSelectModel={(value) => {
                  if (replacingModel) {
                    handleReplaceModel(replacingModel, value);
                  } else {
                    handleAddModel(value);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        ) : null}
        {/* Mobile drawer */}
        <Drawer open={!isDesktop && pickerOpen} onOpenChange={setPickerOpen}>
          <DrawerContent>
            <div className="mt-4 border-t">
              <ModelPicker
                open={pickerOpen}
                setOpen={setPickerOpen}
                replacingModel={replacingModel}
                onSelectModel={(value) => {
                  if (replacingModel) {
                    handleReplaceModel(replacingModel, value);
                  } else {
                    handleAddModel(value);
                  }
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};
