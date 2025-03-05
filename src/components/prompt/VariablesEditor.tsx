'use client';

import { IconTrash } from '@tabler/icons-react';
import { PromptVariable } from '@/components/editors/PromptContentEditor';
import { Database } from '@/app/__generated__/supabase.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/shadcn';

type VariablesEditorProps = {
  variables: PromptVariable[];
  onVariablesChange: (variables: PromptVariable[]) => void;
  readOnly?: boolean;
  className?: string;
};

export const VariablesEditor = (props: VariablesEditorProps) => {
  const { variables, onVariablesChange, readOnly = false, className } = props;

  const removeVariable = (index: number) => {
    if (readOnly) return;
    onVariablesChange(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (
    index: number,
    field: keyof PromptVariable,
    value: string | boolean
  ) => {
    if (readOnly) return;
    const newVariables = [...variables];
    newVariables[index] = {
      ...newVariables[index],
      [field]:
        field === 'type' && typeof value === 'string'
          ? (value.toUpperCase() as Database['public']['Enums']['variable_type'])
          : value,
    };
    onVariablesChange(newVariables);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {variables.map((variable, index) => (
        <Card
          key={variable.id || `var-${index}`}
          className={cn(readOnly && 'opacity-70')}
        >
          <CardContent>
            <div className="flex justify-between items-center gap-1 mb-4">
              <div className="bg-muted p-2 rounded-md flex-1">
                <div className="font-medium">{variable.name}</div>
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVariable(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <IconTrash className="h-4 w-4 text-red-700" />
                </Button>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={variable.type}
                  onValueChange={(value) =>
                    updateVariable(index, 'type', value)
                  }
                  disabled={readOnly}
                >
                  <SelectTrigger>
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`required-${index}`}
                  checked={variable.required}
                  onCheckedChange={(checked) =>
                    updateVariable(index, 'required', checked === true)
                  }
                  disabled={readOnly}
                />
                <Label htmlFor={`required-${index}`}>Required</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {variables.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-4">
          No variables found. Add variables to your prompt or edit template to
          add variables.
        </p>
      )}
    </div>
  );
};
