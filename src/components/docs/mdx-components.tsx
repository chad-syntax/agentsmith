import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { createGenerator } from 'fumadocs-typescript';
import { AutoTypeTable } from 'fumadocs-typescript/ui';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { Mermaid } from './mermaid';
import { cn } from '@/utils/shadcn';

const generator = createGenerator();

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    TypeTable: (props) => <TypeTable {...props} />,
    AutoTypeTable: (props) => <AutoTypeTable {...props} generator={generator} />,
    Mermaid,
    img: (props) => <ImageZoom className={cn(props.className, 'rounded-lg border')} {...props} />,
    ...components,
  };
}
