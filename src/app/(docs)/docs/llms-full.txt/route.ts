import { source } from '@/lib/docs/source';
import { getLLMText } from '@/lib/docs/get-llm-text';

// cached forever
export const revalidate = false;

export async function GET() {
  const scan = source.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}
