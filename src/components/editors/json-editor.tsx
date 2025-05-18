'use client';

import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';
import { AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/utils/shadcn';
import './json-editor.css';

type JsonEditorProps<T> = {
  value: T;
  onChange?: (value: T) => void;
  minHeight?: string;
  placeholder?: string;
  label?: string;
  className?: string;
  readOnly?: boolean;
};

export const JsonEditor = <T extends object>(props: JsonEditorProps<T>) => {
  const {
    value,
    onChange,
    minHeight = '100px',
    placeholder = '{}',
    label,
    className,
    readOnly = false,
  } = props;

  const [jsonText, setJsonText] = useState<string>(JSON.stringify(value, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      onChange?.(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError('Invalid JSON');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      <div
        className={cn(
          'rounded-md border bg-background',
          jsonError && 'border-destructive',
          readOnly && 'opacity-70',
        )}
      >
        <Editor
          value={jsonText}
          onValueChange={readOnly ? () => {} : handleJsonChange}
          highlight={(code) => highlight(code ?? '{}', languages.json, 'json')}
          disabled={readOnly}
          padding={16}
          placeholder={placeholder}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            minHeight,
          }}
          className="w-full"
        />
      </div>
      {jsonError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{jsonError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
