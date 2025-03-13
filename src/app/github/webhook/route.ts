import { NextRequest } from 'next/server';
import { EmitterWebhookEventName } from '@octokit/webhooks/dist-types/types';
import { createClient } from '@/lib/supabase/server';
import { AgentsmithServices } from '@/lib/AgentsmithServices';

const handler = async (req: NextRequest) => {
  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  await agentsmith.services.github.app.webhooks.verifyAndReceive({
    id: req.headers.get('X-GitHub-Delivery') as string,
    name: req.headers.get('X-GitHub-Event') as EmitterWebhookEventName,
    signature: req.headers.get('X-Hub-Signature-256') as string,
    payload: await req.text(),
  });

  return new Response('ok');
};

export { handler as GET, handler as POST };
