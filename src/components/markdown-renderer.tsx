'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/utils/shadcn';
import remarkGfm from 'remark-gfm';

type MarkdownRendererProps = {
  children: string;
  className?: string;
};

export const MarkdownRenderer = (props: MarkdownRendererProps) => {
  const { children, className } = props;
  return (
    <div className={cn('prose dark:prose-invert', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
};
