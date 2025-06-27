'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/utils/shadcn';
import './unreset.css';

type MarkdownRendererProps = {
  children: string;
  className?: string;
};

export const MarkdownRenderer = (props: MarkdownRendererProps) => {
  const { children, className } = props;
  return (
    <div className={cn('prose dark:prose-invert unreset', className)}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
};
