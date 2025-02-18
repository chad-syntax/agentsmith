import { NextRequest, mockJson } from './test-utils';
import { __DUMMY_AGENTS__ } from '@/app/constants';
import { GET, POST } from '@/app/api/[apiVersion]/agents/route';

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

describe('Agents API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of agents', async () => {
    const req = NextRequest('http://localhost:3000/api/v1/agents', {
      method: 'GET',
    });
    const params = Promise.resolve({
      apiVersion: 'v1',
    });

    await GET(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          slug: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          currentVersionId: expect.any(String),
        }),
      ]),
      { status: 200 }
    );
  });

  it('should handle errors appropriately', async () => {
    const req = NextRequest('http://localhost:3000/api/v1/agents', {
      method: 'GET',
    });
    const params = Promise.resolve({
      apiVersion: 'v1',
    });

    // Mock database error
    jest
      .spyOn(require('@/utils/supabase/server'), 'createClient')
      .mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Database error')),
      });

    await GET(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  });

  it('should create a new agent', async () => {
    const validAgent = {
      name: 'Test Agent',
      slug: 'test_agent',
      version: '1.0.0',
      actions: [],
      reactions: [],
    };

    const req = NextRequest('http://localhost:3000/api/v1/agents', {
      method: 'POST',
      body: JSON.stringify(validAgent),
    });
    const params = Promise.resolve({
      apiVersion: 'v1',
    });

    // Mock successful agent creation
    jest
      .spyOn(require('@/utils/supabase/server'), 'createClient')
      .mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'new-agent-id',
            name: validAgent.name,
            slug: validAgent.slug,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });

    await POST(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      {
        agent: expect.objectContaining({
          id: expect.any(String),
          name: validAgent.name,
          slug: validAgent.slug,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
        version: expect.objectContaining({
          id: expect.any(String),
          version: validAgent.version,
          actions: validAgent.actions,
          reactions: validAgent.reactions,
          createdAt: expect.any(String),
          publishedAt: expect.any(String),
        }),
      },
      { status: 201 }
    );
  });

  it('should handle invalid input', async () => {
    const invalidAgent = {
      slug: 'test_agent',
      version: '1.0.0',
    };

    const req = NextRequest('http://localhost:3000/api/v1/agents', {
      method: 'POST',
      body: JSON.stringify(invalidAgent),
    });
    const params = Promise.resolve({
      apiVersion: 'v1',
    });

    await POST(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      { error: 'Name is required' },
      { status: 400 }
    );
  });
});
