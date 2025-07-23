import { source } from '@/lib/docs/source';
import { promises as fs } from 'fs';
import path from 'path';

// cached forever
export const revalidate = false;

export async function GET() {
  const marketingPath = path.join(process.cwd(), 'src', 'app', 'llms.txt', 'marketing.md');
  const marketingLlmsTxt = await fs.readFile(marketingPath, 'utf-8');
  const pages = source.getPages();
  const docLinks = pages
    .map((page) => `- [${page.data.title}](${page.url}.mdx): ${page.data.description || ''}`)
    .join('\n');

  const docsTxt = `## Docs\n\n${docLinks}`;

  return new Response([marketingLlmsTxt, docsTxt].join('\n\n'));
}
