import { AgentsmithClient } from './sdk';
import { Agency } from './generated_agentsmith.types';

describe('AgentsmithClient', () => {
  let client: AgentsmithClient<Agency>;

  beforeEach(() => {
    client = new AgentsmithClient<Agency>('test-api-key');
  });

  it('should get and compile prompts with type safety', async () => {
    const prompt = await client.getPrompt('qualify_lead');
    const compiledPrompt = prompt.compile({
      company_info: 'Acme Corp',
      contact_name: 'John Doe',
      budget_range: '$100k-$500k',
    });
    expect(compiledPrompt).toBeDefined();
    expect(compiledPrompt).toContain('Acme Corp');
    expect(compiledPrompt).toContain('John Doe');
  });

  it("should throw an error if getPrompt is called with a prompt slug that doesn't exist", async () => {
    await expect(
      // Need to cast to any to test runtime behavior
      (client.getPrompt as any)('non_existent_prompt')
    ).rejects.toThrow('Prompt non_existent_prompt not found');
  });

  it('should throw an error if passed a variable that is not a variable of the prompt', async () => {
    const prompt = await client.getPrompt('qualify_lead');
    expect(() => (prompt.compile as any)({ invalid_variable: 'test' })).toThrow(
      'Unknown variable: invalid_variable'
    );
  });

  it('should throw an error if passed a variable of the wrong type', async () => {
    const prompt = await client.getPrompt('qualify_lead');
    const wrongTypeVars = {
      company_info: 123 as any, // Explicitly cast to any to test runtime behavior
      contact_name: 'John',
      budget_range: '$100k',
    };
    expect(() => prompt.compile(wrongTypeVars)).toThrow(
      'Invalid type for variable company_info: expected string, got number'
    );
  });

  it('should throw an error if required variable is not passed', async () => {
    const prompt = await client.getPrompt('qualify_lead');
    const incompleteVars = {
      company_info: 'Acme Corp',
      budget_range: '$100k',
    } as any; // Cast to any to bypass type checking for test
    expect(() => prompt.compile(incompleteVars)).toThrow(
      'Missing required variable: contact_name'
    );
  });

  it('should enforce type safety for agent actions', async () => {
    const agent = await client.getAgent('lead_agent');
    const instance = await agent.createInstance({ user: { id: '123' } });

    const response = await instance.action('qualify_lead', {
      company_info: 'Acme Corp',
      contact_name: 'John Doe',
      budget_range: '$100k-$500k',
    });

    expect(response.content).toBeDefined();
    expect(response.content).toContain('Mocked response for qualify_lead');
  });

  it("should throw an error if getAgent is called with an agent slug that doesn't exist", async () => {
    await expect(
      // Need to cast to any to test runtime behavior
      (client.getAgent as any)('non_existent_agent')
    ).rejects.toThrow('Agent non_existent_agent not found');
  });

  it('should allow creating agent instance with custom context', async () => {
    const agent = await client.getAgent('lead_agent');
    const customContext = {
      user: { id: '123', name: 'Test User' },
      custom_field: 'test value',
    };
    const instance = await agent.createInstance(customContext);
    const response = await instance.action('qualify_lead', {
      company_info: 'Acme Corp',
      contact_name: 'John Doe',
      budget_range: '$100k-$500k',
    });
    expect(response.content).toBeDefined();
  });

  it('should throw an error if a required string variable is empty', async () => {
    const prompt = await client.getPrompt('qualify_lead');
    const varsWithEmptyString = {
      company_info: '', // empty string for required field
      contact_name: 'John Doe',
      budget_range: '$100k-$500k',
    };
    expect(() => prompt.compile(varsWithEmptyString)).toThrow(
      'Required string variable company_info cannot be empty'
    );
  });
});
