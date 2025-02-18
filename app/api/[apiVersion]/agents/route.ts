import { NextRequest, NextResponse } from 'next/server';
import { __DUMMY_AGENTS__, Agent, AgentVersion } from '@/app/constants';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apiVersion: string }> }
) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('agentsmith_users')
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }

    const agents = Object.values(__DUMMY_AGENTS__).map((agent) => ({
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      createdAt: agent.createdAt.toISOString(),
      updatedAt: agent.updatedAt.toISOString(),
      currentVersionId: agent.currentVersionId,
    }));
    return NextResponse.json(agents, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ apiVersion: string }> }
) {
  try {
    const { apiVersion } = await params;
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const now = new Date();

    // Create both the agent and its first version
    const agent: Agent = {
      id: 'new-agent-id',
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '_'),
      createdAt: now,
      updatedAt: now,
      currentVersionId: 'new-version-id',
    };

    const version: AgentVersion = {
      id: 'new-version-id',
      agentId: agent.id,
      name: agent.name,
      slug: agent.slug,
      version: body.version || '1.0.0',
      systemPrompt: {
        id: 'default-system-prompt-id',
      },
      actions: body.actions || [],
      reactions: body.reactions || [],
      config: {},
      createdAt: now,
      publishedAt: now,
    };

    return NextResponse.json(
      {
        agent: {
          id: agent.id,
          name: agent.name,
          slug: agent.slug,
          createdAt: agent.createdAt.toISOString(),
          updatedAt: agent.updatedAt.toISOString(),
        },
        version: {
          id: version.id,
          version: version.version,
          actions: version.actions,
          reactions: version.reactions,
          createdAt: version.createdAt.toISOString(),
          publishedAt: version.publishedAt?.toISOString() || null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 422 }
    );
  }
}
