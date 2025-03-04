import { NextRequest } from 'next/server';
import { POST } from '@/app/api/[apiVersion]/promptVersion/[promptVersionUuid]/execute/route';
import { createClient } from '@/lib/supabase/server';
import { createVaultService } from '@/lib/vault';
import {
  runPrompt,
  getPromptVersionByUuid,
  getMissingVariables,
} from '@/lib/prompts';

// Mock the external dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/vault', () => ({
  createVaultService: jest.fn(),
}));

jest.mock('@/lib/prompts', () => ({
  getPromptVersionByUuid: jest.fn(),
  getMissingVariables: jest.fn(),
  runPrompt: jest.fn(),
}));

describe('Execute API Route', () => {
  const mockPromptVersionUuid = 'test-uuid';
  const mockUser = { id: 'test-user' };
  const mockOrganizationUuid = 'test-org-uuid';
  const mockApiKey = 'test-api-key';
  const mockPromptVersion = {
    id: 1,
    uuid: mockPromptVersionUuid,
    content: 'Hello {{ name }}!',
    prompt_variables: [{ name: 'name', type: 'STRING', required: true }],
    prompts: {
      projects: {
        organizations: {
          uuid: mockOrganizationUuid,
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    (createVaultService as jest.Mock).mockResolvedValue({
      getOrganizationKeySecret: jest
        .fn()
        .mockResolvedValue({ value: mockApiKey }),
    });
    (getPromptVersionByUuid as jest.Mock).mockResolvedValue(mockPromptVersion);
    (getMissingVariables as jest.Mock).mockReturnValue([]);
  });

  it('should return 400 if promptVersionUuid is missing', async () => {
    const request = new NextRequest(
      'http://localhost/api/v1/promptVersion/execute',
      {
        method: 'POST',
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ promptVersionUuid: '' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Prompt ID is required');
  });

  it('should return 401 if user is not authenticated', async () => {
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const request = new NextRequest(
      'http://localhost/api/v1/promptVersion/execute',
      {
        method: 'POST',
        body: JSON.stringify({ variables: { name: 'Test' } }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ promptVersionUuid: mockPromptVersionUuid }),
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if prompt version is not found', async () => {
    (getPromptVersionByUuid as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/v1/promptVersion/execute',
      {
        method: 'POST',
        body: JSON.stringify({ variables: { name: 'Test' } }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ promptVersionUuid: 'non-existent' }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Prompt version not found');
  });

  it('should return 400 if request body is invalid', async () => {
    const request = new NextRequest(
      'http://localhost/api/v1/promptVersion/execute',
      {
        method: 'POST',
        body: 'invalid-json',
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ promptVersionUuid: mockPromptVersionUuid }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 if required variables are missing', async () => {
    (getMissingVariables as jest.Mock).mockReturnValue(['name']);

    const request = new NextRequest(
      'http://localhost/api/v1/promptVersion/execute',
      {
        method: 'POST',
        body: JSON.stringify({ variables: {} }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ promptVersionUuid: mockPromptVersionUuid }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing required variables');
  });

  it('should return 412 if OpenRouter API key is missing', async () => {
    (createVaultService as jest.Mock).mockResolvedValue({
      getOrganizationKeySecret: jest.fn().mockResolvedValue({ value: null }),
    });

    const request = new NextRequest(
      'http://localhost/api/v1/promptVersion/execute',
      {
        method: 'POST',
        body: JSON.stringify({ variables: { name: 'Test' } }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ promptVersionUuid: mockPromptVersionUuid }),
    });

    expect(response.status).toBe(412);
    const data = await response.json();
    expect(data.error).toBe(
      'OpenRouter API key not found. Please connect your account to OpenRouter before testing prompts.'
    );
  });

  it('should successfully execute prompt with valid input', async () => {
    const variables = { name: 'Test' };
    const mockResponse = {
      completion: { choices: [{ message: { content: 'Hello Test!' } }] },
      logUuid: 'test-log-uuid',
    };

    (runPrompt as jest.Mock).mockResolvedValue(mockResponse);

    const request = new NextRequest(
      'http://localhost/api/v1/promptVersion/execute',
      {
        method: 'POST',
        body: JSON.stringify({ variables }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ promptVersionUuid: mockPromptVersionUuid }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockResponse);
  });

  it('should return 500 if prompt execution fails', async () => {
    (runPrompt as jest.Mock).mockRejectedValue(new Error('Execution failed'));

    const request = new NextRequest(
      'http://localhost/api/v1/promptVersion/execute',
      {
        method: 'POST',
        body: JSON.stringify({ variables: { name: 'Test' } }),
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ promptVersionUuid: mockPromptVersionUuid }),
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Error running prompt');
  });
});
