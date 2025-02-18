import { NextRequest, mockJson } from './test-utils';
import {
  GET as getAgent,
  GET as getVersions,
  GET as getVersion,
  GET as getInstances,
} from '@/app/api/[apiVersion]/agents/[agentId]/route';
import { __DUMMY_AGENTS__, __DUMMY_AGENT_VERSIONS__ } from '@/app/constants';

jest.mock('next/server');
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: Object.values(__DUMMY_AGENTS__)[0],
    }),
  }),
}));

describe('Agent Details API Routes', () => {
  const testAgent = Object.values(__DUMMY_AGENTS__)[0];
  const testVersion = Object.values(__DUMMY_AGENT_VERSIONS__)[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return agent details', async () => {
    const req = NextRequest(
      'http://localhost:3000/api/v1/agents/' + testAgent.id,
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      agentId: testAgent.id,
    });

    await getAgent(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        id: testAgent.id,
        name: testAgent.name,
        slug: testAgent.slug,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        currentVersionId: expect.any(String),
      }),
      { status: 200 }
    );
  });

  it('should return agent versions', async () => {
    const req = NextRequest(
      'http://localhost:3000/api/v1/agents/' + testAgent.id + '/versions',
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      agentId: testAgent.id,
    });

    // Mock versions response
    jest
      .spyOn(require('@/utils/supabase/server'), 'createClient')
      .mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          data: Object.values(__DUMMY_AGENT_VERSIONS__),
        }),
      });

    await getVersions(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          agentId: testAgent.id,
          version: expect.any(String),
          name: expect.any(String),
          slug: expect.any(String),
          createdAt: expect.any(String),
          publishedAt: expect.any(String),
          actions: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              slug: expect.any(String),
              prompt: expect.objectContaining({
                id: expect.any(String),
              }),
            }),
          ]),
          reactions: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              slug: expect.any(String),
              prompt: expect.objectContaining({
                id: expect.any(String),
              }),
              triggers: expect.any(Array),
            }),
          ]),
        }),
      ]),
      { status: 200 }
    );
  });

  it('should handle non-existent agent', async () => {
    const req = NextRequest(
      'http://localhost:3000/api/v1/agents/non-existent/versions',
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      agentId: 'non-existent',
    });

    // Mock no data response
    jest
      .spyOn(require('@/utils/supabase/server'), 'createClient')
      .mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null }),
      });

    await getVersions(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      { error: 'Agent not found' },
      { status: 404 }
    );
  });

  it('should return specific version details', async () => {
    const req = NextRequest(
      'http://localhost:3000/api/v1/agents/' +
        testAgent.id +
        '/versions/' +
        testVersion.id,
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      agentId: testAgent.id,
      versionId: testVersion.id,
    });

    // Mock version response
    jest
      .spyOn(require('@/utils/supabase/server'), 'createClient')
      .mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: testVersion,
        }),
      });

    await getVersion(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        id: testVersion.id,
        agentId: testVersion.agentId,
        version: testVersion.version,
        name: expect.any(String),
        slug: expect.any(String),
        createdAt: expect.any(String),
        publishedAt: expect.any(String),
        actions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            slug: expect.any(String),
            prompt: expect.objectContaining({
              id: expect.any(String),
            }),
          }),
        ]),
        reactions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            slug: expect.any(String),
            prompt: expect.objectContaining({
              id: expect.any(String),
            }),
            triggers: expect.any(Array),
          }),
        ]),
      }),
      { status: 200 }
    );
  });

  it('should return agent instances', async () => {
    const req = NextRequest(
      'http://localhost:3000/api/v1/agents/' + testAgent.id + '/instances',
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      agentId: testAgent.id,
    });

    // Mock instances response
    jest
      .spyOn(require('@/utils/supabase/server'), 'createClient')
      .mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'instance-1',
              agentId: testAgent.id,
              agentVersionId: testVersion.id,
              name: 'Test Instance',
              status: 'active',
              ctx: {},
              state: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      });

    await getInstances(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          agentId: testAgent.id,
          agentVersionId: expect.any(String),
          name: expect.any(String),
          status: expect.any(String),
          ctx: expect.any(Object),
          state: expect.any(Object),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      ]),
      { status: 200 }
    );
  });

  it('should handle non-existent agent for instances', async () => {
    const req = NextRequest(
      'http://localhost:3000/api/v1/agents/non-existent/instances',
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      agentId: 'non-existent',
    });

    // Mock no data response
    jest
      .spyOn(require('@/utils/supabase/server'), 'createClient')
      .mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null }),
      });

    await getInstances(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      { error: 'Agent not found' },
      { status: 404 }
    );
  });
});
