import fs from 'fs';
import path from 'path';
import { AgentsmithClient } from '~/sdk/index';
import { Agency } from './agentsmith/agentsmith.types';

const agentsmithDirectory = path.join(__dirname, 'agentsmith');
const apiKey = 'sdk_dummy';
const projectId = 'project_dummy';

describe('AgentsmithClient (runtime)', () => {
  let client: AgentsmithClient<Agency>;

  beforeEach(() => {
    client = new AgentsmithClient<Agency>(apiKey, projectId, {
      agentsmithDirectory,
    });
  });

  it('gets and compiles a prompt that exists on the local file system', async () => {
    const prompt = await client.getPrompt('hello-world@0.0.3');
    const { compiledPrompt, finalVariables } = await prompt.compile({
      firstName: 'John',
      lastName: 'Doe',
    });

    expect(compiledPrompt).toContain('John');
    expect(finalVariables).toHaveProperty('firstName', 'John');
    expect(finalVariables).toHaveProperty('lastName', 'Doe');
  });

  it('compiles a prompt that requires no variables', async () => {
    const prompt = await client.getPrompt('hello-world@0.0.1');
    const { compiledPrompt } = await prompt.compile();
    expect(typeof compiledPrompt).toBe('string');
  });

  it('compiles with variables and global overrides', async () => {
    const prompt = await client.getPrompt('hello-world@0.0.2');

    const { compiledPrompt, finalVariables } = await prompt.compile(
      { name: 'John' },
      { globals: { gitHubUrl: 'https://github.com/example' } },
    );

    expect(compiledPrompt).toContain('John');
    expect(finalVariables.global.gitHubUrl).toBe('https://github.com/example');
  });

  it('throws at runtime when required variables are missing', async () => {
    const prompt = await client.getPrompt('hello-world@0.0.2');

    // Cast to any so we can bypass TS compile-time checks and test runtime behaviour
    await expect(prompt.compile({} as any)).rejects.toThrow('Missing required variables');
  });

  it('executes a prompt and returns a completion', async () => {
    const prompt = await client.getPrompt('hello-world@0.0.3');
    const result = await prompt.execute(
      { firstName: 'John', lastName: 'Doe' },
      { config: { models: ['my-model'], temperature: 0.3 } },
    );

    expect(result.completion.choices[0].message.content).toBe('Hello from OpenRouter!');
    expect(result.logUuid).toEqual('mock-log-uuid');
  });

  describe('database fallback', () => {
    const slug = 'db-prompt';
    const version = '0.0.1';
    let readFileSpy: jest.SpyInstance;

    beforeEach(() => {
      // Force fs.readFile to throw ENOENT so SDK falls back to the database
      const enoentErr = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      readFileSpy = jest.spyOn(fs.promises, 'readFile').mockRejectedValue(enoentErr);

      // Configure Supabase mock to return prompt + globals
      const mockSupabase = (global as any).mockSupabase as jest.Mocked<any>;

      // Helper to build a chainable PostgREST query builder stub
      const createBuilder = (response: any) => {
        const b: any = {};
        const chain = () => b;
        ['select', 'eq', 'in', 'is', 'order', 'gte', 'lte'].forEach((m) => (b[m] = jest.fn(chain)));
        b.single = jest.fn(async () => response);
        b.then = (resolve: any, reject: any) => Promise.resolve(response).then(resolve, reject);
        return b;
      };

      const promptVersionResponse = {
        data: {
          uuid: 'db-version-uuid',
          version,
          config: { models: ['test-model'], temperature: 1 },
          content: 'Hello {{ name }}!',
          prompt_variables: [
            {
              uuid: 'var-uuid',
              name: 'name',
              type: 'STRING',
              required: true,
              default_value: null,
            },
          ],
          prompts: { uuid: 'prompt-uuid', name: 'DB Prompt', slug },
        },
        error: null,
      };

      const globalsResponse = {
        data: { content: {} },
        error: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'prompt_versions') {
          return createBuilder(promptVersionResponse);
        }
        if (table === 'global_contexts') {
          return createBuilder(globalsResponse);
        }
        return createBuilder({ data: null, error: null });
      });
    });

    afterEach(() => {
      readFileSpy.mockRestore();
    });

    it('fetches and compiles prompt data from the database when not found on disk', async () => {
      const dbClient = new AgentsmithClient<Agency>(apiKey, projectId, {
        agentsmithDirectory: '/non/existent/path', // intentionally bad path
      });

      const prompt = await dbClient.getPrompt(`${slug}@${version}` as any);
      const { compiledPrompt } = await (prompt as any).compile({ name: 'John' });

      expect(compiledPrompt).toContain('John');
    });
  });
});
