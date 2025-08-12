import { after } from 'next/server';
import { ORGANIZATION_KEYS } from '@/app/constants';
import { createClient } from '@/lib/supabase/server';
import { createJwtClient, exchangeApiKeyForJwt } from '@/lib/supabase/server-api-key';
import { NextResponse } from 'next/server';
import { CompletionConfig } from '@/lib/openrouter';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { validateGlobalContext, validateVariables } from '@/utils/template-utils';
import merge from 'lodash.merge';
import { OpenrouterStreamEvent, streamToIterator } from '@/utils/stream-to-iterator';
import { LLMLogsService } from '@/lib/LLMLogsService';
import { mergeIncludedVariables } from '@/utils/merge-included-variables';
import { accumulateChatStreamToCompletion } from '@/utils/accumulate-stream';

export const maxDuration = 320; // 5m20s minute function timeout

type RequestBody = {
  variables: Record<string, string | number | boolean | object>;
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
      const exchangeResult = await exchangeApiKeyForJwt(apiKey);
      jwt = exchangeResult.jwt;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
  }

  if (apiKey && jwt === null) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const supabase = jwt ? createJwtClient(jwt) : await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  const { authUser } = await agentsmith.services.users.getAuthUser();

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  }

  if (promptVersion.type === 'CHAT') {
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

  const finalConfig = merge(promptVersion.config, body.config, {
    usage: {
      include: true,
    },
  });

  try {
    const response = await agentsmith.services.prompts.executePrompt({
      prompt: promptVersion.prompts,
      config: finalConfig,
      targetVersion: promptVersion,
      variables: variablesWithDefaults,
      promptIncludes: promptVersion.prompt_includes,
      globalContext: globalContext as Record<string, any>,
    });

    if (response.stream) {
      const [streamForClient, streamForLogging] = response.stream.tee();

      const logStreamedCompletion = async () => {
        try {
          const fullCompletion = await accumulateChatStreamToCompletion(
            streamToIterator<OpenrouterStreamEvent>(streamForLogging),
          );

          await agentsmith.services.llmLogs.updateLogWithCompletion(
            response.logUuid,
            fullCompletion,
          );
        } catch (error) {
          agentsmith.logger.error(error, 'Error logging streamed completion');
          await agentsmith.services.llmLogs.updateLogWithCompletion(response.logUuid, {
            error: `Failed to log stream: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      };

      after(logStreamedCompletion);

      const customEventStream = new TransformStream({
        start(controller) {
          const logUuidEvent = LLMLogsService.createLogUuidSSE(response.logUuid);
          controller.enqueue(new TextEncoder().encode(logUuidEvent));
        },
        transform(chunk, controller) {
          controller.enqueue(chunk);
        },
      });

      return new Response(streamForClient.pipeThrough(customEventStream), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if ((error as Error)?.message === 'Request timed out') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
    }
    if (error instanceof Error && error.message.includes('Failed to create log entry')) {
      return NextResponse.json(
        { error: 'Failed to create log entry, please check your plan limits and try again.' },
        { status: 403 },
      );
    }
    if (error instanceof Error && error.message.includes('Error calling OpenRouter API')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    agentsmith.logger.error(error, 'Error running prompt');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error running prompt' },
      { status: 500 },
    );
  }
}
