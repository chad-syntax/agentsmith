import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { createJwtClient } from '@/lib/supabase/server-api-key';
import { exchangeApiKeyForJwt } from '@/lib/supabase/server-api-key';
import { mergeIncludedVariables } from '@/utils/merge-included-variables';
import {
  compileChatPrompts,
  compilePrompt,
  validateGlobalContext,
  validateVariables,
} from '@/utils/template-utils';
import { NextResponse } from 'next/server';
import { makePromptLoader } from '@/utils/make-prompt-loader';
import { EditorPromptPvChatPrompt } from '@/lib/PromptsService';

type RequestBody = {
  variables: Record<string, string | number | boolean>;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ promptVersionUuid: string }> },
) {
  const { promptVersionUuid } = await params;

  if (!promptVersionUuid) {
    return NextResponse.json({ error: 'Prompt Version UUID is required' }, { status: 400 });
  }

  const apiKeyHeader = request.headers.get('x-api-key');
  let jwt: string | null = null;

  if (apiKeyHeader) {
    try {
      const exchangeResult = await exchangeApiKeyForJwt(apiKeyHeader);
      jwt = exchangeResult.jwt;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
  }

  if (apiKeyHeader && jwt === null) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const supabase = jwt ? createJwtClient(jwt) : await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const { authUser } = await agentsmith.services.users.getAuthUser();

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the prompt from Supabase
  const promptVersion = await agentsmith.services.prompts.getPromptVersionByUuid(promptVersionUuid);

  if (!promptVersion) {
    return NextResponse.json({ error: 'Prompt version not found' }, { status: 404 });
  }

  const variables = promptVersion.prompt_variables || [];
  const includedPromptVariables =
    promptVersion.prompt_includes?.flatMap((pi) => pi.prompt_versions.prompt_variables) || [];
  const globalContext = promptVersion.prompts.projects.global_contexts?.content ?? {};

  let body: RequestBody;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const allVariables = mergeIncludedVariables({
    variables,
    includedPromptVariables,
  });

  const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
    allVariables,
    body.variables,
  );

  if (missingRequiredVariables.length > 0) {
    return NextResponse.json(
      {
        error: 'Missing required variables',
        missingRequiredVariables,
      },
      { status: 400 },
    );
  }

  const promptLoader = makePromptLoader(promptVersion.prompt_includes);

  if (promptVersion.type === 'NON_CHAT') {
    const { missingGlobalContext } = validateGlobalContext(
      promptVersion.content ?? '',
      globalContext as Record<string, any>,
    );

    if (missingGlobalContext.length > 0) {
      return NextResponse.json(
        { error: 'Missing required global context variables', missingGlobalContext },
        { status: 400 },
      );
    }

    const compiledPrompt = compilePrompt(
      promptVersion.content ?? '',
      {
        ...variablesWithDefaults,
        global: globalContext as Record<string, any>,
      },
      promptLoader,
    );

    return NextResponse.json({ compiledPrompt }, { status: 200 });
  }

  const allMissingGlobalContext = promptVersion.pv_chat_prompts.flatMap((pvChatPrompt) => {
    const { missingGlobalContext } = validateGlobalContext(
      pvChatPrompt.content ?? '',
      globalContext as Record<string, any>,
    );
    return missingGlobalContext;
  });

  if (allMissingGlobalContext.length > 0) {
    return NextResponse.json(
      {
        error: 'Missing required global context variables',
        missingGlobalContext: allMissingGlobalContext,
      },
      { status: 400 },
    );
  }

  const compiledMessages = compileChatPrompts(
    promptVersion.pv_chat_prompts as EditorPromptPvChatPrompt[],
    {
      ...variablesWithDefaults,
      global: globalContext as Record<string, any>,
    },
    promptLoader,
  );

  return NextResponse.json({ compiledMessages }, { status: 200 });
}
