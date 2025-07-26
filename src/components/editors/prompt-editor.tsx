'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-django';
import 'prismjs/themes/prism.css';
import { AlertCircle } from 'lucide-react';
import { extract, ParsedInclude } from '@/utils/template-utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/utils/shadcn';
import { ParsedVariable } from '@/utils/template-utils';

type PromptContentEditorProps = {
  content: string;
  onContentChange: (content: string) => void;
  onVariablesChange?: (variables: ParsedVariable[]) => void;
  onIncludesChange?: (includes: ParsedInclude[]) => void;
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
      // TODO make this recursive
      currentVar.children?.length !== newVar.children?.length ||
      currentVar.children?.some((child, index) => child.name !== newVar.children?.[index]?.name)
    ) {
      return true;
    }
  }

  return false;
};

const isIncludeDiff = (currentIncludes: ParsedInclude[], newIncludes: ParsedInclude[]): boolean => {
  if (currentIncludes.length !== newIncludes.length) return true;

  return currentIncludes.some((include, index) => include.arg !== newIncludes[index].arg);
};

export const PromptContentEditor = (props: PromptContentEditorProps) => {
  const {
    content,
    onContentChange,
    onVariablesChange,
    onIncludesChange,
    readOnly = false,
    minHeight = '300px',
    className,
  } = props;

  const [templateError, setTemplateError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const detectedVariablesRef = useRef<ParsedVariable[]>([]);
  const detectedIncludesRef = useRef<ParsedInclude[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  // Effect to detect variables when content changes
  useEffect(() => {
    if (!onVariablesChange && !onIncludesChange) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const { variables: detectedVariables, includes: detectedIncludes, error } = extract(content);

      const isDiff =
        isVariableDiff(detectedVariablesRef.current, detectedVariables) ||
        isIncludeDiff(detectedIncludesRef.current, detectedIncludes);

      if (!error && isDiff) {
        onVariablesChange?.(detectedVariables);
        onIncludesChange?.(detectedIncludes);
        detectedVariablesRef.current = detectedVariables;
        detectedIncludesRef.current = detectedIncludes;
      }

      setTemplateError(error?.message ?? null);
    }, 250);
  }, [content]);

  return (
    <div className={cn('space-y-2 text-sm', className)}>
      <div
        className={cn(
          'rounded-md border bg-background',
          templateError && 'border-destructive',
          readOnly && 'opacity-70',
          isFocused && 'border-ring ring-ring/50 ring-[1px]',
        )}
      >
        <Editor
          value={content}
          onValueChange={readOnly ? () => {} : onContentChange}
          highlight={(code) => highlight(code, languages.django, 'django')}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          padding={16}
          disabled={readOnly}
          style={{
            minHeight,
          }}
          className="w-full"
          textareaClassName="outline-none"
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
