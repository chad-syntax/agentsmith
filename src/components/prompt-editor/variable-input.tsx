'use client';

import { Database } from '@/app/__generated__/supabase.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { JsonEditor } from '@/components/editors/json-editor';
import { cn } from '@/utils/shadcn';
import { EditorPromptVariable } from '@/types/prompt-editor';

type VariableInputProps = {
  variable: EditorPromptVariable;
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
};

export const VariableInput = (props: VariableInputProps) => {
  const { variable, value, onChange, readOnly, className, placeholder } = props;

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.valueAsNumber;
    if (!isNaN(num)) {
      onChange(num);
    } else if (e.target.value === '') {
      onChange(undefined);
    }
  };

  const handleJsonChange = (obj: object) => {
    onChange(obj);
  };

  switch (variable.type) {
    case 'STRING':
      return (
        <Input
          id={variable.name}
          type="text"
          value={value ?? ''}
          placeholder={
            placeholder ?? (variable.default_value ? `Default: ${variable.default_value}` : '')
          }
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={className}
        />
      );
    case 'NUMBER':
      return (
        <Input
          id={variable.name}
          type="number"
          value={value ?? ''}
          placeholder={
            placeholder ?? (variable.default_value ? `Default: ${variable.default_value}` : '')
          }
          onChange={handleNumberChange}
          disabled={readOnly}
          className={className}
        />
      );
    case 'BOOLEAN':
      return (
        <div className={cn('flex items-center space-x-2 h-10', className)}>
          <Switch
            id={variable.name}
            checked={!!value}
            onCheckedChange={onChange}
            disabled={readOnly}
          />
          <Label htmlFor={variable.name} className="cursor-pointer select-none">
            {value ? 'True' : 'False'}
          </Label>
        </div>
      );
    case 'JSON':
      let jsonValue = {};
      try {
        jsonValue = typeof value === 'object' && value !== null ? value : JSON.parse(value);
      } catch (e) {
        jsonValue = {};
      }
      return (
        <JsonEditor
          value={jsonValue}
          onChange={handleJsonChange}
          readOnly={readOnly}
          minHeight="100px"
          className={className}
          placeholder={placeholder}
        />
      );
    default:
      return (
        <Input
          id={variable.name}
          type="text"
          value={value || ''}
          placeholder={`Unsupported type: ${variable.type}`}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={className}
        />
      );
  }
};
