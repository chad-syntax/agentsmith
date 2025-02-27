import { NextRequest, mockJson } from './test-utils';
import { POST as runPrompt } from '@/app/api/[apiVersion]/prompts/[promptId]/run/route';
import { Database } from '@/app/__generated__/supabase.types';

// Mock OpenAI
const mockCompletion = {
  choices: [
    {
      message: {
        content: 'Test response',
      },
    },
  ],
};

jest.mock('openai', () => {
  return class MockOpenAI {
    chat = {
      completions: {
        create: jest.fn().mockResolvedValue(mockCompletion),
      },
    };
  };
});

// Mock prompt data
const mockPromptVersion = {
  id: 1,
  content: 'Test prompt with {{ variable1 }} and {{ variable2 }}',
  model: 'openrouter/auto',
  created_at: new Date().toISOString(),
  prompt_variables: [
    {
      id: 1,
      name: 'variable1',
      type: 'STRING',
      required: true,
    },
    {
      id: 2,
      name: 'variable2',
      type: 'STRING',
      required: true,
    },
  ],
};

const mockPrompt = {
  id: 1,
  uuid: 'test-prompt-id',
  name: 'Test Prompt',
  prompt_versions: [mockPromptVersion],
};

// Mock Supabase client
jest.mock('~/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: { id: 'test-user-id' },
        },
      }),
    },
    from: jest.fn().mockImplementation((table) => {
      if (table === 'prompts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          data: [mockPrompt],
          error: null,
        };
      } else if (table === 'agentsmith_users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: 1,
              auth_user_id: 'test-user-id',
            },
            error: null,
          }),
        };
      } else if (table === 'projects') {
        return {
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          data: [{ id: 1, name: 'Test Project' }],
          error: null,
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        data: null,
        error: null,
      };
    }),
  }),
}));

// Mock vault service
jest.mock('~/lib/vault', () => ({
  createVaultService: jest.fn().mockResolvedValue({
    getUserKeySecret: jest.fn().mockResolvedValue({
      value: 'test-api-key',
      error: null,
    }),
  }),
}));

// Mock log functions
jest.mock('~/lib/logs', () => ({
  createLogEntry: jest.fn().mockResolvedValue({ uuid: 'test-log-uuid' }),
  updateLogWithCompletion: jest.fn().mockResolvedValue({}),
}));

jest.mock('next/server');

describe('Prompts API Routes', () => {
  const testPromptId = 'test-prompt-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/[apiVersion]/prompts/[promptId]/run', () => {
    it('should run a prompt successfully', async () => {
      const variables = {
        variable1: 'Test value 1',
        variable2: 'Test value 2',
      };

      const req = NextRequest(
        `http://localhost:3000/api/v1/prompts/${testPromptId}/run`,
        {
          method: 'POST',
          body: JSON.stringify({
            variables,
          }),
        }
      );
      const params = Promise.resolve({ promptId: testPromptId });

      await runPrompt(req, { params });
      expect(mockJson).toHaveBeenCalledWith(
        { completion: mockCompletion },
        { status: 200 }
      );
    });

    it('should handle missing prompt ID', async () => {
      const req = NextRequest(
        'http://localhost:3000/api/v1/prompts/invalid/run',
        {
          method: 'POST',
          body: JSON.stringify({
            variables: {
              test: 'value',
            },
          }),
        }
      );
      const params = Promise.resolve({ promptId: '' });

      await runPrompt(req, { params });
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    });

    it('should handle invalid request body', async () => {
      const req = NextRequest(
        `http://localhost:3000/api/v1/prompts/${testPromptId}/run`,
        {
          method: 'POST',
          body: 'invalid-json',
        }
      );
      const params = Promise.resolve({ promptId: testPromptId });

      await runPrompt(req, { params });
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    });

    it('should handle missing required variables', async () => {
      const req = NextRequest(
        `http://localhost:3000/api/v1/prompts/${testPromptId}/run`,
        {
          method: 'POST',
          body: JSON.stringify({
            variables: {},
          }),
        }
      );
      const params = Promise.resolve({ promptId: testPromptId });

      await runPrompt(req, { params });
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing required variables',
          missingVariables: expect.any(Array),
        }),
        { status: 400 }
      );
    });
  });
});
