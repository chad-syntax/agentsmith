import { RootProvider } from 'fumadocs-ui/provider';
import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { options } from './layout.config';
import { source } from '@/lib/docs/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider>
      <DocsLayout tree={source.pageTree} {...options}>
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
