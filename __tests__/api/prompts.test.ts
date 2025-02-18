import { NextRequest, mockJson } from './test-utils';
import { POST as runPrompt } from '@/app/api/[apiVersion]/prompts/[promptId]/run/route';
import { __DUMMY_PROMPTS__ } from '@/app/constants';

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

// Mock Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: { id: 'test-user-id' },
        },
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          auth_user_id: 'test-user-id',
          openrouter_api_key: 'test-api-key',
        },
      }),
    }),
  }),
}));

jest.mock('next/server');

describe('Prompts API Routes', () => {
  const testPromptId = Object.keys(__DUMMY_PROMPTS__)[0];
  const testPrompt = __DUMMY_PROMPTS__[testPromptId];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/[apiVersion]/prompts/[promptId]/run', () => {
    it('should run a prompt successfully', async () => {
      const variables = {
        company_info: 'Acme Corp',
        contact_name: 'John Doe',
        budget_range: '$100k-$500k',
      };

      const req = NextRequest(
        'http://localhost:3000/api/v1/prompts/' + testPromptId + '/run',
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
      const params = Promise.resolve({ promptId: 'invalid' });

      await runPrompt(req, { params });
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    });

    it('should handle invalid request body', async () => {
      const req = NextRequest(
        'http://localhost:3000/api/v1/prompts/' + testPromptId + '/run',
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
        'http://localhost:3000/api/v1/prompts/' + testPromptId + '/run',
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
