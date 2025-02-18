import OpenAI from 'openai';
// @ts-ignore needs to be browser version so nextjs can import it
import nunjucks from 'nunjucks/browser/nunjucks';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { __DUMMY_PROMPTS__ } from '@/app/constants';

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

  const targetPrompt = __DUMMY_PROMPTS__[promptId];

  if (!targetPrompt) {
    return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
  }

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
  const missingVariables = targetPrompt.variables
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

  if (!agentsmithUser.openrouter_api_key) {
    return NextResponse.json(
      { error: 'OpenRouter API key not found' },
      { status: 404 }
    );
  }

  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: agentsmithUser.openrouter_api_key,
    defaultHeaders: {
      'HTTP-Referer': 'https://agentsmith.app',
      'X-Title': 'Agentsmith',
    },
  });

  // Replace variables in the prompt content using nunjucks
  let promptContent: string;
  try {
    promptContent = nunjucks.renderString(targetPrompt.content, body.variables);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error rendering prompt template' },
      { status: 500 }
    );
  }

  const completion = await openai.chat.completions.create({
    model: targetPrompt.model ?? 'openrouter/auto',
    messages: [
      {
        role: 'user',
        content: promptContent,
      },
    ],
  });

  return NextResponse.json({ completion }, { status: 200 });
}
