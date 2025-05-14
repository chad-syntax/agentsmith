import { PromptsService } from '../../src/lib/PromptsService';
import { Database } from '@/app/__generated__/supabase.types';

type PromptVariable = Database['public']['Tables']['prompt_variables']['Row'];

// Mock SupabaseClient for PromptsService instantiation
const mockSupabase: any = {};

const promptsService = new PromptsService({ supabase: mockSupabase });

describe('PromptsService - compileVariables', () => {
  it('should return empty missing and include all provided variables when all required are given', () => {
    const variables: PromptVariable[] = [
      {
        id: 1,
        name: 'var1',
        type: 'STRING',
        required: true,
        default_value: null,
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
      {
        id: 2,
        name: 'var2',
        type: 'NUMBER',
        required: true,
        default_value: null,
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
    ];
    const variablesToCheck = { var1: 'hello', var2: 123 };
    const { missingRequiredVariables, variablesWithDefaults } = promptsService.validateVariables(
      variables,
      variablesToCheck,
    );

    expect(missingRequiredVariables).toEqual([]);
    expect(variablesWithDefaults).toEqual({ var1: 'hello', var2: 123 });
  });

  it('should identify missing required variables', () => {
    const variables: PromptVariable[] = [
      {
        id: 1,
        name: 'var1',
        type: 'STRING',
        required: true,
        default_value: null,
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
      {
        id: 2,
        name: 'var2',
        type: 'NUMBER',
        required: true,
        default_value: null,
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
      {
        id: 3,
        name: 'var3',
        type: 'BOOLEAN',
        required: false,
        default_value: null,
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
    ];
    const variablesToCheck = { var1: 'hello' }; // Missing var2
    const { missingRequiredVariables, variablesWithDefaults } = promptsService.validateVariables(
      variables,
      variablesToCheck,
    );

    expect(missingRequiredVariables).toHaveLength(1);
    expect(missingRequiredVariables[0].name).toBe('var2');
    expect(variablesWithDefaults).toEqual({ var1: 'hello' });
  });

  it('should apply default values for missing optional variables', () => {
    const variables: PromptVariable[] = [
      {
        id: 1,
        name: 'var1',
        type: 'STRING',
        required: true,
        default_value: null,
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
      {
        id: 2,
        name: 'var2',
        type: 'NUMBER',
        required: false,
        default_value: '42',
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
      {
        id: 3,
        name: 'var3',
        type: 'BOOLEAN',
        required: false,
        default_value: 'true',
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
    ];
    const variablesToCheck = { var1: 'test' }; // Missing var2 and var3
    const { missingRequiredVariables, variablesWithDefaults } = promptsService.validateVariables(
      variables,
      variablesToCheck,
    );

    expect(missingRequiredVariables).toEqual([]);
    expect(variablesWithDefaults).toEqual({ var1: 'test', var2: '42', var3: 'true' });
  });

  it('should override default values if variables are provided', () => {
    const variables: PromptVariable[] = [
      {
        id: 1,
        name: 'var1',
        type: 'STRING',
        required: false,
        default_value: 'default1',
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
      {
        id: 2,
        name: 'var2',
        type: 'NUMBER',
        required: false,
        default_value: '100',
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
    ];
    const variablesToCheck = { var1: 'override1', var2: 200 };
    const { missingRequiredVariables, variablesWithDefaults } = promptsService.validateVariables(
      variables,
      variablesToCheck,
    );

    expect(missingRequiredVariables).toEqual([]);
    expect(variablesWithDefaults).toEqual({ var1: 'override1', var2: 200 });
  });

  it('should handle a mix of missing required, provided, and default values', () => {
    const variables: PromptVariable[] = [
      {
        id: 1,
        name: 'req1',
        type: 'STRING',
        required: true,
        default_value: null,
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      }, // Missing
      {
        id: 2,
        name: 'req2',
        type: 'NUMBER',
        required: true,
        default_value: null,
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      }, // Provided
      {
        id: 3,
        name: 'opt1',
        type: 'BOOLEAN',
        required: false,
        default_value: 'false',
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      }, // Default used
      {
        id: 4,
        name: 'opt2',
        type: 'STRING',
        required: false,
        default_value: 'defaultOpt2',
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      }, // Overridden
      {
        id: 5,
        name: 'opt3',
        type: 'NUMBER',
        required: false,
        default_value: null,
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      }, // No default, not provided
    ];
    const variablesToCheck = { req2: 999, opt2: 'overriddenOpt2' };
    const { missingRequiredVariables, variablesWithDefaults } = promptsService.validateVariables(
      variables,
      variablesToCheck,
    );

    expect(missingRequiredVariables).toHaveLength(1);
    expect(missingRequiredVariables[0].name).toBe('req1');
    expect(variablesWithDefaults).toEqual({
      req2: 999,
      opt1: 'false', // Default applied
      opt2: 'overriddenOpt2', // Override applied
      // opt3 is missing as it wasn't provided and had no default
    });
  });

  it('should return empty results for empty inputs', () => {
    const variables: PromptVariable[] = [];
    const variablesToCheck = {};
    const { missingRequiredVariables, variablesWithDefaults } = promptsService.validateVariables(
      variables,
      variablesToCheck,
    );

    expect(missingRequiredVariables).toEqual([]);
    expect(variablesWithDefaults).toEqual({});
  });

  it('should handle only optional variables with some provided', () => {
    const variables: PromptVariable[] = [
      {
        id: 1,
        name: 'opt1',
        type: 'STRING',
        required: false,
        default_value: 'a',
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
      {
        id: 2,
        name: 'opt2',
        type: 'NUMBER',
        required: false,
        default_value: '1',
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
    ];
    const variablesToCheck = { opt1: 'b' };
    const { missingRequiredVariables, variablesWithDefaults } = promptsService.validateVariables(
      variables,
      variablesToCheck,
    );

    expect(missingRequiredVariables).toEqual([]);
    expect(variablesWithDefaults).toEqual({ opt1: 'b', opt2: '1' });
  });

  it('should handle only optional variables with none provided', () => {
    const variables: PromptVariable[] = [
      {
        id: 1,
        name: 'opt1',
        type: 'STRING',
        required: false,
        default_value: 'a',
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
      {
        id: 2,
        name: 'opt2',
        type: 'NUMBER',
        required: false,
        default_value: '1',
        created_at: '',
        prompt_version_id: 1,
        uuid: '',
        updated_at: '',
      },
    ];
    const variablesToCheck = {};
    const { missingRequiredVariables, variablesWithDefaults } = promptsService.validateVariables(
      variables,
      variablesToCheck,
    );

    expect(missingRequiredVariables).toEqual([]);
    expect(variablesWithDefaults).toEqual({ opt1: 'a', opt2: '1' });
  });
});
