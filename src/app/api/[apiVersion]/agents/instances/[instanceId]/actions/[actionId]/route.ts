import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import nunjucks from 'nunjucks/browser/nunjucks';
import {
  __DUMMY_AGENT_INSTANCES__,
  __DUMMY_AGENT_VERSIONS__,
  __DUMMY_PROMPTS__,
} from '@//app/constants';
import { OpenAI } from 'openai';
import { createClient } from '&/supabase/server';

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      apiVersion: string;
      instanceId: string;
      actionId: string;
    }>;
  }
) {
  try {
    const { instanceId, actionId } = await params;
    const instance = __DUMMY_AGENT_INSTANCES__[instanceId];

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    const version = __DUMMY_AGENT_VERSIONS__[instance.agentVersionId];
    const action = version.actions.find((a) => a.id === actionId);

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    return NextResponse.json(action, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch action details' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      apiVersion: string;
      instanceId: string;
      actionId: string;
    }>;
  }
) {
  try {
    const { instanceId, actionId } = await params;
    const body = await request.json();
    const instance = __DUMMY_AGENT_INSTANCES__[instanceId];

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    const agentVersion = __DUMMY_AGENT_VERSIONS__[instance.agentVersionId];
    const action = agentVersion.actions.find((a) => a.id === actionId);

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // TODO: in the future this would use the same code as the SDK to compile the prompt with all the same type safety
    const targetPrompt = __DUMMY_PROMPTS__[action.prompt.id];

    if (!targetPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // TODO consolidate all of this into lib and share w/ sdk

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
      promptContent = nunjucks.renderString(
        targetPrompt.content,
        body.variables
      );
    } catch (error) {
      return NextResponse.json(
        { error: 'Error rendering prompt template' },
        { status: 500 }
      );
    }

    console.log('promptContent', promptContent);

    const completion = await openai.chat.completions.create({
      model: targetPrompt.model ?? 'openrouter/auto:online',
      // @ts-ignore
      plugins: [
        {
          id: 'web',
          max_results: 1, // Defaults to 5
          search_prompt: 'Some relevant web results:', // See default below
        },
      ],
      messages: [
        {
          role: 'user',
          content: promptContent,
        },
      ],
    });

    console.log('completion', completion);

    return NextResponse.json(
      {
        success: true,
        actionId,
        timestamp: new Date().toISOString(),
        data: completion,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
