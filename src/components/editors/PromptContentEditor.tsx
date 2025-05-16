'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-django';
import 'prismjs/themes/prism.css';
import { AlertCircle } from 'lucide-react';
import { extractTemplateVariables } from '@/utils/template-utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/utils/shadcn';
import { ParsedVariable } from '@/utils/template-utils';

type PromptContentEditorProps = {
  content: string;
  onContentChange: (content: string) => void;
  onVariablesChange?: (variables: ParsedVariable[]) => void;
  readOnly?: boolean;
  minHeight?: string;
  className?: string;
};

const isVariableDiff = (currentVars: ParsedVariable[], newVars: ParsedVariable[]): boolean => {
  if (currentVars.length !== newVars.length) return true;

  for (let i = 0; i < currentVars.length; i++) {
    const currentVar = currentVars[i];
    const newVar = newVars[i];
    if (
      currentVar.name !== newVar.name ||
      currentVar.type !== newVar.type ||
      currentVar.required !== newVar.required ||
      currentVar.default_value !== newVar.default_value ||
      // TODO make this recursive
      currentVar.children?.length !== newVar.children?.length ||
      currentVar.children?.some((child, index) => child.name !== newVar.children?.[index]?.name)
    ) {
      return true;
    }
  }

  return false;
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
  const detectedVariablesRef = useRef<ParsedVariable[]>([]);

  // Effect to detect variables when content changes
  useEffect(() => {
    if (!onVariablesChange) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const { variables: detectedVariables, error } = extractTemplateVariables(content);

      const isDiff = isVariableDiff(detectedVariablesRef.current, detectedVariables);

      if (!error && isDiff) {
        onVariablesChange(detectedVariables);
        detectedVariablesRef.current = detectedVariables;
      }

      setTemplateError(error?.message ?? null);
    }, 250);
  }, [content]);

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'rounded-md border bg-background',
          templateError && 'border-destructive',
          readOnly && 'opacity-70',
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
