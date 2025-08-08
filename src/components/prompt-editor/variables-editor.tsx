'use client';

import { Database } from '@/app/__generated__/supabase.types';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/shadcn';
import { EditorPromptVariable } from '@/types/prompt-editor';
import { usePromptPage } from '@/providers/prompt-page';
import { VariableInput } from './variable-input';

type VariableType = Database['public']['Enums']['variable_type'];

const typeColors: Record<VariableType, string> = {
  STRING: 'bg-green-500',
  NUMBER: 'bg-orange-500',
  BOOLEAN: 'bg-blue-500',
  JSON: 'bg-red-500',
};

type VariablesEditorProps = {
  readOnly?: boolean;
  className?: string;
};

export const VariablesEditor = (props: VariablesEditorProps) => {
  const { readOnly = false, className } = props;

  const { state, updateEditorVariables } = usePromptPage();
  const { editorVariables } = state;

  const updateVariable = (
    index: number,
    field: keyof EditorPromptVariable,
    value: string | boolean,
  ) => {
    const newVariables = [...editorVariables];
    const variableToUpdate = { ...newVariables[index] };

    if (field === 'type' && typeof value === 'string') {
      variableToUpdate[field] = value.toUpperCase() as VariableType;
    } else if (field === 'required') {
      variableToUpdate[field] = value as boolean;
      // If a variable is marked as required, its default_value should be cleared or considered irrelevant
      // Or, ensure default_value logic handles this (e.g., not allowing default for required, or ignoring it)
      // For now, let's keep default_value as is, but this might need refinement based on desired behavior.
    } else if (field === 'default_value') {
      variableToUpdate[field] = value as string;
    } else {
      // @ts-expect-error - this is a valid assignment
      variableToUpdate[field] = value;
    }

    newVariables[index] = variableToUpdate;
    updateEditorVariables(newVariables);
  };

  const handleDefaultValueChange = (index: number, value: any) => {
    const newVariables = [...editorVariables];
    newVariables[index] = {
      ...newVariables[index],
      default_value: value,
    };
    updateEditorVariables(newVariables);
  };

  const getBadgeColor = (type: VariableType) => {
    return typeColors[type] || 'bg-gray-500 hover:bg-gray-600'; // Default color
  };

  if (editorVariables.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-4">
        No variables found. Add variables to your prompt.
      </p>
    );
  }

  return (
    <Accordion type="multiple" className={cn('space-y-1', className)}>
      {editorVariables.map((variable, index) => (
        <AccordionItem
          key={variable.id || `var-${index}`}
          value={String(variable.id || `var-${index}`)}
        >
          <AccordionTrigger
            className={cn(
              'flex justify-between items-center rounded-md hover:no-underline cursor-pointer',
            )}
          >
            <div className="flex items-center gap-2">
              <div className="flex justify-start items-start gap-0.5">
                <span className="font-medium hover:underline">{variable.name}</span>
                {variable.required && <span className="text-destructive leading-none">*</span>}
              </div>
              <Badge className={cn('text-white', getBadgeColor(variable.type))}>
                {variable.type}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent
            className={cn(
              'p-4 pt-2 space-y-4 border rounded-b-md bg-background mb-4',
              readOnly && 'pt-4',
            )}
          >
            {!readOnly && (
              <div className="space-y-2 flex items-center gap-2">
                <Label className="mb-0" htmlFor={`type-${index}`}>
                  Type
                </Label>
                <Select
                  value={variable.type}
                  onValueChange={(value) => updateVariable(index, 'type', value)}
                  name={`type-${index}`}
                >
                  <SelectTrigger id={`type-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STRING">String</SelectItem>
                    <SelectItem value="NUMBER">Number</SelectItem>
                    <SelectItem value="BOOLEAN">Boolean</SelectItem>
                    <SelectItem value="JSON">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`required-${index}`}
                checked={variable.required}
                onCheckedChange={(checked) => updateVariable(index, 'required', checked === true)}
                disabled={readOnly}
              />
              <Label htmlFor={`required-${index}`}>Required</Label>
            </div>

            {!variable.required && (
              <div className="space-y-2">
                <Label htmlFor={`default-${index}`}>Default Value</Label>
                <VariableInput
                  variable={variable}
                  value={variable.default_value}
                  onChange={(value) => handleDefaultValueChange(index, value)}
                  readOnly={readOnly}
                  placeholder={'Optional default value'}
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
