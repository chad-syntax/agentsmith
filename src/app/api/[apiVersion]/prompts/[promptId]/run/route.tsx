import OpenAI from 'openai';
// @ts-ignore needs to be browser version so nextjs can import it
import nunjucks from 'nunjucks/browser/nunjucks';
import { createClient } from '~/lib/supabase/server';
import { NextResponse } from 'next/server';
import { USER_KEYS } from '@/app/constants';
import { createVaultService } from '~/lib/vault';
import { createLogEntry, updateLogWithCompletion } from '~/lib/logs';
import { getPromptById, getLatestPromptVersion } from '@/lib/prompts';

type RequestBody = {
  variables: Record<string, string | number | boolean>;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ promptId: string }> }
) {
  const { promptId } = await params;

  if (!promptId) {
    return NextResponse.json(
      { error: 'Prompt ID is required' },
      { status: 400 }
    );
  }

  // Fetch the prompt from Supabase
  const prompt = await getPromptById(promptId);

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
  }

  // Get the latest version
  const latestVersion = getLatestPromptVersion(prompt);

  if (!latestVersion) {
    return NextResponse.json(
      { error: 'No versions found for prompt' },
      { status: 404 }
    );
  }

  const variables = latestVersion.prompt_variables || [];

  // Parse request body
  let body: RequestBody;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  // Validate all required variables are present
  const missingVariables = variables
    .filter((v) => v.required)
    .filter((v) => !(v.name in body.variables))
    .map((v) => v.name);

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

  // Get the first project for now (later we'll have a proper project context)
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .limit(1)
    .order('created_at', { ascending: false });

  if (projectsError || !projects || projects.length === 0) {
    return NextResponse.json(
      { error: 'No projects found for user' },
      { status: 404 }
    );
  }

  const project = projects[0];

  // Create vault service to get the OpenRouter API key
  const vaultService = await createVaultService();
  const { value: openrouterApiKey, error: keyError } =
    await vaultService.getUserKeySecret(USER_KEYS.OPENROUTER_API_KEY);

  if (keyError || !openrouterApiKey) {
    return NextResponse.json(
      { error: 'OpenRouter API key not found' },
      { status: 404 }
    );
  }

  // Replace variables in the prompt content using nunjucks
  let promptContent: string;
  try {
    promptContent = nunjucks.renderString(
      latestVersion.content,
      body.variables
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Error rendering prompt template' },
      { status: 500 }
    );
  }

  // Create a log entry before making the API call
  const rawInput = {
    messages: [{ role: 'user', content: promptContent }],
    model: latestVersion.model ?? 'openrouter/auto',
  };

  const logEntry = await createLogEntry(
    project.id,
    latestVersion.id,
    body.variables,
    rawInput
  );

  if (!logEntry) {
    return NextResponse.json(
      { error: 'Failed to create log entry' },
      { status: 500 }
    );
  }

  // Initialize OpenAI client for OpenRouter
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: openrouterApiKey,
    defaultHeaders: {
      'HTTP-Referer': 'https://agentsmith.app',
      'X-Title': 'Agentsmith',
    },
  });

  try {
    // Make the API call
    const completion = await openai.chat.completions.create({
      model: latestVersion.model ?? 'openrouter/auto',
      messages: [
        {
          role: 'user',
          content: promptContent,
        },
      ],
    });

    // Update the log entry with the completion data
    await updateLogWithCompletion(logEntry.uuid, completion);

    return NextResponse.json({ completion }, { status: 200 });
  } catch (error) {
    // In case of error, still update the log but with the error information
    await updateLogWithCompletion(logEntry.uuid, { error: String(error) });

    return NextResponse.json(
      { error: 'Error calling OpenRouter API' },
      { status: 500 }
    );
  }
}
