'use client';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism.css';
import { cn } from '@/utils/shadcn';
import './json-editor.css';

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

  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn('rounded-md border bg-background', innerClassName)}>
        <Editor
          value={value}
          onValueChange={readOnly ? () => {} : onChange}
          highlight={(code) => highlight(code, languages.markdown, 'markdown')}
          disabled={readOnly}
          padding={16}
          placeholder={placeholder}
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
