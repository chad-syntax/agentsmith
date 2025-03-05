'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-django';
import 'prismjs/themes/prism.css';
import { AlertCircle } from 'lucide-react';
import { extractTemplateVariables } from '@/lib/template-utils';
import { Database } from '@/app/__generated__/supabase.types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/utils/shadcn';

export type PromptVariable = {
  id?: number;
  name: string;
  type: Database['public']['Enums']['variable_type'];
  required: boolean;
};

type PromptContentEditorProps = {
  content: string;
  onContentChange: (content: string) => void;
  onVariablesChange?: (variables: PromptVariable[]) => void;
  readOnly?: boolean;
  minHeight?: string;
  className?: string;
};

export const PromptContentEditor = (props: PromptContentEditorProps) => {
  const {
    content,
    onContentChange,
    onVariablesChange,
    readOnly = false,
    minHeight = '300px',
    className,
  } = props;

  const [templateError, setTemplateError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to detect variables when content changes
  useEffect(() => {
    if (!onVariablesChange) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const { variables: detectedVariables, error } =
        extractTemplateVariables(content);

      if (!error) {
        onVariablesChange(detectedVariables);
      }

      setTemplateError(error?.message ?? null);
    }, 250);
  }, [content, onVariablesChange]);

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'rounded-md border bg-background',
          templateError && 'border-destructive',
          readOnly && 'opacity-70'
        )}
      >
        <Editor
          value={content}
          onValueChange={readOnly ? () => {} : onContentChange}
          highlight={(code) => highlight(code, languages.django, 'django')}
          padding={16}
          disabled={readOnly}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            minHeight,
          }}
          className="w-full"
        />
      </div>

      {templateError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-bold">Template Error: </span>
            {templateError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
