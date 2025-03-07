import {
  getMissingVariables,
  getPromptVersionByUuid,
  runPrompt,
} from '@/lib/prompts';
import { ORGANIZATION_KEYS } from '@/app/constants';
import { createClient } from '@/lib/supabase/server';
import {
  createJwtClient,
  exchangeApiKeyForJwt,
} from '@/lib/supabase/server-api-key';
import { createVaultService } from '@/lib/vault';
import { NextResponse } from 'next/server';

type RequestBody = {
  variables: Record<string, string | number | boolean>;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ promptVersionUuid: string }> }
) {
  const { promptVersionUuid } = await params;

  if (!promptVersionUuid) {
    return NextResponse.json(
      { error: 'Prompt ID is required' },
      { status: 400 }
    );
  }

  const apiKeyHeader = request.headers.get('x-api-key');
  let jwt: string | null = null;
  if (apiKeyHeader) {
    try {
      jwt = await exchangeApiKeyForJwt(apiKeyHeader);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
  }

  if (apiKeyHeader && jwt === null) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const supabase = jwt ? await createJwtClient(jwt) : await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (jwt) {
    console.log('assumed user', JSON.stringify(user, null, 2));
  }

  // Fetch the prompt from Supabase
  const promptVersion = await getPromptVersionByUuid(
    promptVersionUuid,
    supabase
  );

  if (!promptVersion) {
    return NextResponse.json(
      { error: 'Prompt version not found' },
      { status: 404 }
    );
  }

  const variables = promptVersion.prompt_variables || [];

  let body: RequestBody;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const missingVariables = getMissingVariables(variables, body.variables);

  if (missingVariables.length > 0) {
    return NextResponse.json(
      {
        error: 'Missing required variables',
        missingVariables,
      },
      { status: 400 }
    );
  }

  const project = promptVersion.prompts.projects;
  const organizationUuid = project.organizations.uuid;

  console.log('target promptVersion', JSON.stringify(promptVersion, null, 2));

  // Create vault service to get the OpenRouter API key
  const vaultService = await createVaultService(supabase);
  const { value: apiKey } = await vaultService.getOrganizationKeySecret(
    organizationUuid,
    ORGANIZATION_KEYS.OPENROUTER_API_KEY
  );

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'OpenRouter API key not found. Please connect your account to OpenRouter before testing prompts.',
      },
      { status: 412 }
    );
  }

  try {
    const response = await runPrompt({
      apiKey,
      prompt: promptVersion.prompts,
      targetVersion: promptVersion,
      variables: body.variables,
      alternateClient: supabase,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error running prompt' },
      { status: 500 }
    );
  }
}
