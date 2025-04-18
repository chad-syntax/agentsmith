import { ORGANIZATION_KEYS } from '@/app/constants';
import { createClient } from '@/lib/supabase/server';
import { createJwtClient, exchangeApiKeyForJwt } from '@/lib/supabase/server-api-key';
import { NextResponse } from 'next/server';
import { CompletionConfig } from '@/lib/openrouter';
import { AgentsmithServices } from '@/lib/AgentsmithServices';

type RequestBody = {
  variables: Record<string, string | number | boolean>;
  config?: CompletionConfig;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ promptVersionUuid: string }> },
) {
  const { promptVersionUuid } = await params;

  if (!promptVersionUuid) {
    return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
  }

  const apiKey = request.headers.get('x-api-key');

  let jwt: string | null = null;

  if (apiKey) {
    try {
      jwt = await exchangeApiKeyForJwt(apiKey);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
  }

  if (apiKey && jwt === null) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const supabase = jwt ? createJwtClient(jwt) : await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const { authUser } = await agentsmith.services.users.initialize();

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const promptVersion = await agentsmith.services.prompts.getPromptVersionByUuid(promptVersionUuid);

  if (!promptVersion) {
    return NextResponse.json({ error: 'Prompt version not found' }, { status: 404 });
  }

  const variables = promptVersion.prompt_variables || [];

  let body: RequestBody;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const missingVariables = agentsmith.services.prompts.getMissingVariables(
    variables,
    body.variables,
  );

  if (missingVariables.length > 0) {
    return NextResponse.json(
      {
        error: 'Missing required variables',
        missingVariables,
      },
      { status: 400 },
    );
  }

  const openrouterApiKey = await agentsmith.services.organizations.getOrganizationKeySecret(
    promptVersion.prompts.projects.organizations.uuid,
    ORGANIZATION_KEYS.OPENROUTER_API_KEY,
  );

  if (!openrouterApiKey) {
    return NextResponse.json(
      {
        error:
          'OpenRouter API key not found. Please connect your account to OpenRouter before testing prompts.',
      },
      { status: 412 },
    );
  }

  try {
    const response = await agentsmith.services.prompts.executePrompt({
      prompt: promptVersion.prompts,
      config: {
        ...(promptVersion.config as CompletionConfig),
        ...(body.config ?? {}),
      },
      targetVersion: promptVersion,
      variables: body.variables,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error running prompt' }, { status: 500 });
  }
}
