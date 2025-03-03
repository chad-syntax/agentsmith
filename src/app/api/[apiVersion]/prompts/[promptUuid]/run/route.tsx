import {
  getLatestPromptVersion,
  getMissingVariables,
  runPrompt,
} from '@/lib/prompts';
import { ORGANIZATION_KEYS } from '@/app/constants';
import { getPromptById } from '@/lib/prompts';
import { createClient } from '@/lib/supabase/server';
import { createVaultService } from '@/lib/vault';
import { NextResponse } from 'next/server';

type RequestBody = {
  variables: Record<string, string | number | boolean>;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ promptUuid: string }> }
) {
  const { promptUuid } = await params;

  if (!promptUuid) {
    return NextResponse.json(
      { error: 'Prompt ID is required' },
      { status: 400 }
    );
  }

  // Fetch the prompt from Supabase
  const prompt = await getPromptById(promptUuid);

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
  }

  // Get the latest version
  const latestVersion = await getLatestPromptVersion(prompt.id);

  if (!latestVersion) {
    return NextResponse.json(
      { error: 'No versions found for prompt' },
      { status: 404 }
    );
  }

  const variables = latestVersion.prompt_variables || [];

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

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: agentsmithUser, error: agentsmithUserError } = await supabase
    .from('agentsmith_users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (agentsmithUserError) {
    return NextResponse.json(
      { error: 'Error fetching agentsmith user' },
      { status: 500 }
    );
  }

  if (!agentsmithUser) {
    return NextResponse.json(
      { error: 'Agentsmith user not found' },
      { status: 404 }
    );
  }

  const project = prompt.projects;
  const organizationUuid = project.organizations.uuid;

  // Create vault service to get the OpenRouter API key
  const vaultService = await createVaultService();
  const { value: apiKey } = await vaultService.getOrganizationKeySecret(
    organizationUuid,
    ORGANIZATION_KEYS.OPENROUTER_API_KEY
  );

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenRouter API key not found' },
      { status: 404 }
    );
  }

  try {
    const response = await runPrompt({
      apiKey,
      prompt,
      targetVersion: latestVersion,
      variables: body.variables,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error running prompt' },
      { status: 500 }
    );
  }
}
