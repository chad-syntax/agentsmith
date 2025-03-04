import { NextRequest } from 'next/server';
import { POST } from '@/app/api/[apiVersion]/promptVersion/[promptVersionUuid]/compile/route';
import { createClient } from '@/lib/supabase/server';
import {
  compilePrompt,
  getPromptVersionByUuid,
  getMissingVariables,
} from '@/lib/prompts';

// Mock the external dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/prompts', () => ({
  getPromptVersionByUuid: jest.fn(),
  compilePrompt: jest.fn(),
  getMissingVariables: jest.fn(),
}));

describe('Compile API Route', () => {
  const mockPromptVersionUuid = 'test-uuid';
  const mockUser = { id: 'test-user' };
  const mockPromptVersion = {
    id: 1,
    uuid: mockPromptVersionUuid,
    content: 'Hello {{ name }}!',
    prompt_variables: [{ name: 'name', type: 'STRING', required: true }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    (getPromptVersionByUuid as jest.Mock).mockResolvedValue(mockPromptVersion);
  });

  it('should return 400 if promptVersionUuid is missing', async () => {
    const request = new NextRequest(
      'http://localhost/api/v1/promptVersion/compile',
      {
        method: 'POST',
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ promptVersionUuid: '' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Prompt Version UUID is required');
  });

  it('should return 401 if user is not authenticated', async () => {
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const request = new NextRequest(
      'http://localhost/api/v1/promptVersion/compile',
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
      'http://localhost/api/v1/promptVersion/compile',
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
      'http://localhost/api/v1/promptVersion/compile',
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
      'http://localhost/api/v1/promptVersion/compile',
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

  it('should successfully compile prompt with valid input', async () => {
    const variables = { name: 'Test' };
    const compiledContent = 'Hello Test!';

    (getMissingVariables as jest.Mock).mockReturnValue([]);
    (compilePrompt as jest.Mock).mockReturnValue(compiledContent);

    const request = new NextRequest(
      'http://localhost/api/v1/promptVersion/compile',
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
    expect(data.compiledPrompt).toBe(compiledContent);
  });
});
