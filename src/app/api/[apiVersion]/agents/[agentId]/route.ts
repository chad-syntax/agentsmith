import { NextRequest, NextResponse } from 'next/server';
import {
  __DUMMY_AGENTS__,
  __DUMMY_AGENT_VERSIONS__,
  __DUMMY_AGENT_INSTANCES__,
} from '@//app/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string; apiVersion: string }> }
) {
  try {
    const { agentId } = await params;
    const path = request.nextUrl.pathname;

    const agent = __DUMMY_AGENTS__[agentId];
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Handle different endpoints
    if (path.endsWith('/versions')) {
      const versions = Object.values(__DUMMY_AGENT_VERSIONS__)
        .filter((v) => v.agentId === agentId)
        .map((version) => ({
          id: version.id,
          agentId: version.agentId,
          version: version.version,
          name: version.name,
          slug: version.slug,
          createdAt: version.createdAt.toISOString(),
          publishedAt: version.publishedAt?.toISOString() || null,
          actions: version.actions.map((action) => ({
            id: action.id,
            name: action.name,
            slug: action.slug,
            prompt: {
              id: action.prompt.id,
            },
          })),
          reactions: version.reactions.map((reaction) => ({
            id: reaction.id,
            name: reaction.name,
            slug: reaction.slug,
            prompt: {
              id: reaction.prompt.id,
            },
            triggers: reaction.triggers,
          })),
        }));
      return NextResponse.json(versions, { status: 200 });
    }

    if (path.includes('/versions/')) {
      const versionId = path.split('/').pop();
      const version = __DUMMY_AGENT_VERSIONS__[versionId!];
      if (!version) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        );
      }
      const formattedVersion = {
        id: version.id,
        agentId: version.agentId,
        version: version.version,
        name: version.name,
        slug: version.slug,
        createdAt: version.createdAt.toISOString(),
        publishedAt: version.publishedAt?.toISOString() || null,
        actions: version.actions.map((action) => ({
          id: action.id,
          name: action.name,
          slug: action.slug,
          prompt: {
            id: action.prompt.id,
          },
        })),
        reactions: version.reactions.map((reaction) => ({
          id: reaction.id,
          name: reaction.name,
          slug: reaction.slug,
          prompt: {
            id: reaction.prompt.id,
          },
          triggers: reaction.triggers,
        })),
      };
      return NextResponse.json(formattedVersion, { status: 200 });
    }

    if (path.endsWith('/instances')) {
      const instances = Object.values(__DUMMY_AGENT_INSTANCES__)
        .filter((i) => i.agentId === agentId)
        .map((instance) => ({
          id: instance.id,
          agentId: instance.agentId,
          agentVersionId: instance.agentVersionId,
          name: instance.name,
          status: instance.status,
          state: instance.state,
          ctx: instance.ctx,
          createdAt: instance.createdAt.toISOString(),
          updatedAt: instance.updatedAt.toISOString(),
        }));
      return NextResponse.json(instances, { status: 200 });
    }

    // Default agent endpoint - return agent details
    const agentDetails = {
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      createdAt: agent.createdAt.toISOString(),
      updatedAt: agent.updatedAt.toISOString(),
      currentVersionId: agent.currentVersionId,
    };

    return NextResponse.json(agentDetails, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agent data' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string; apiVersion: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await request.json();
    // TODO: Validate body
    const agent = {}; // Update in database
    return NextResponse.json(agent, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 422 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string; apiVersion: string }> }
) {
  try {
    const { agentId } = await params;
    // Delete from database
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
