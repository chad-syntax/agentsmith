import { NextRequest } from 'next/server';
import { EmitterWebhookEventName } from '@octokit/webhooks';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createJwtClient, getGithubWebhookUserJwt } from '@/lib/supabase/server-api-key';

const handler = async (req: NextRequest) => {
  const jwt = getGithubWebhookUserJwt();
  const supabase = createJwtClient(jwt);

  const agentsmith = new AgentsmithServices({ supabase, initialize: false });

  agentsmith.services.githubWebhook.initialize();

  await agentsmith.services.githubApp.app.webhooks.verifyAndReceive({
    id: req.headers.get('X-GitHub-Delivery') as string,
    name: req.headers.get('X-GitHub-Event') as EmitterWebhookEventName,
    signature: req.headers.get('X-Hub-Signature-256') as string,
    payload: await req.text(),
  });

  return new Response('ok');
};

export { handler as GET, handler as POST };
