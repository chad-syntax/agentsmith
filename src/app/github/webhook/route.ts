import { App } from 'octokit';
import { NextRequest } from 'next/server';
import { EmitterWebhookEventName } from '@octokit/webhooks/dist-types/types';
import { createClient } from '@/lib/supabase/server';
import { AgentsmithServices } from '@/lib/AgentsmithServices';

const app = new App({
  appId: process.env.GITHUB_APP_ID as string,
  privateKey: Buffer.from(
    process.env.GITHUB_APP_PRIVATE_KEY || '',
    'base64'
  ).toString('utf8'),
  webhooks: {
    secret: process.env.GITHUB_APP_WEBHOOK_SECRET as string,
  },
});

app.webhooks.on('installation', async ({ payload }) => {
  console.log('github webhook: installation', payload);

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  await agentsmith.services.github.handleInstallationWebhook(payload);
});

app.webhooks.on('pull_request.opened', async ({ payload }) => {
  try {
    // Do something
    console.log('github webhook: pull request opened', payload);
  } catch (e) {
    console.error(
      `pull_request.opened handler failed with error: ${(<Error>e).message}`
    );
  }
});

app.webhooks.on('pull_request.edited', async ({ payload }) => {
  try {
    // Do something else
    console.log('github webhook: pull request edited', payload);
  } catch (e) {
    console.error(
      `pull_request.edited handler failed with error: ${(<Error>e).message}`
    );
  }
});

app.webhooks.on('push', async ({ payload }) => {
  try {
    // Do something else
    console.log('github webhook: push', payload);
  } catch (e) {
    console.error(`push handler failed with error: ${(<Error>e).message}`);
  }
});

const handler = async (req: NextRequest) => {
  // create GitHub service here which should have a this.app and we can use it to handle the webhook

  await app.webhooks.verifyAndReceive({
    id: req.headers.get('X-GitHub-Delivery') as string,
    name: req.headers.get('X-GitHub-Event') as EmitterWebhookEventName,
    signature: req.headers.get('X-Hub-Signature-256') as string,
    payload: await req.text(),
  });

  return new Response('ok');
};

export { handler as GET, handler as POST };
