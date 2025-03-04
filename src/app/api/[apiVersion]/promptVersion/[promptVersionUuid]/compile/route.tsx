import {
  compilePrompt,
  getMissingVariables,
  getPromptVersionByUuid,
} from '@/lib/prompts';
import { createClient } from '@/lib/supabase/server';
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
      { error: 'Prompt Version UUID is required' },
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

  // Fetch the prompt from Supabase
  const promptVersion = await getPromptVersionByUuid(promptVersionUuid);

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

  const compiledPrompt = compilePrompt(promptVersion.content, body.variables);

  return NextResponse.json({ compiledPrompt }, { status: 200 });
}
