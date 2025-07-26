'use client';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism.css';
import { cn } from '@/utils/shadcn';
import './json-editor.css';
import { useState } from 'react';

type MarkdownEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  minHeight?: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  innerClassName?: string;
};

export const MarkdownEditor = (props: MarkdownEditorProps) => {
  const {
    value,
    onChange = () => {},
    minHeight = '100px',
    placeholder = '',
    readOnly = false,
    className,
    innerClassName,
  } = props;

  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'rounded-md border bg-background',
          isFocused && 'border-ring ring-ring/50 ring-[1px]',
          innerClassName,
        )}
      >
        <Editor
          value={value}
          onValueChange={readOnly ? () => {} : onChange}
          highlight={(code) => highlight(code, languages.markdown, 'markdown')}
          disabled={readOnly}
          padding={16}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            fontSize: 14,
            minHeight,
          }}
          className="w-full"
        />
      </div>
    </div>
  );
};
