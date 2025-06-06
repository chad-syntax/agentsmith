import {
  extractTemplateVariables,
  validateVariables,
  validateTemplate,
  compilePrompt,
} from '../../src/utils/template-utils';
import { Database } from '@/app/__generated__/supabase.types';

type PromptVariable = Database['public']['Tables']['prompt_variables']['Row'];

describe('extractTemplateVariables', () => {
  it('should extract simple variables', () => {
    const template = `
      Hello {{ name }}!
      The weather is {{ weather }}.
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'name',
          type: 'STRING',
        }),
        expect.objectContaining({
          name: 'weather',
          type: 'STRING',
        }),
      ]),
    );
  });

  it('should extract variables from conditional statements', () => {
    const template = `
      {% if hungry %}
        I am hungry
      {% elif tired %}
        I am tired
      {% else %}
        I am good!
      {% endif %}
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'hungry',
          type: 'STRING',
        }),
        expect.objectContaining({
          name: 'tired',
          type: 'STRING',
        }),
      ]),
    );
  });

  it('should mark variables with dot notation as JSON type and extract children', () => {
    const template = `
      {{ user.name }}
      {{ settings.theme.color }}
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toHaveLength(2);
    expect(variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'user',
          type: 'JSON',
          children: [expect.objectContaining({ name: 'name', type: 'STRING' })],
        }),
        expect.objectContaining({
          name: 'settings',
          type: 'JSON',
          children: [
            expect.objectContaining({
              name: 'theme',
              type: 'JSON',
              children: [expect.objectContaining({ name: 'color', type: 'STRING' })],
            }),
          ],
        }),
      ]),
    );
  });

  it('should mark collection variables as JSON type and not extract loop var properties unless explicitly used', () => {
    const template = `
      {% for item in items %}
        <li>{{ item.title }}</li>
      {% else %}
        <li>This would display if the 'items' collection were empty</li>
      {% endfor %}

      {% for user_loop_var in users_collection %}
        {{ user_loop_var.name }}
      {% endfor %}
      {{ other_var }}
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();

    const itemsVar = variables.find((v) => v.name === 'items');
    expect(itemsVar).toEqual(
      expect.objectContaining({
        name: 'items',
        type: 'JSON',
        children: expect.arrayContaining([
          expect.objectContaining({
            name: 'title',
            type: 'STRING',
          }),
        ]),
      }),
    );

    const usersCollectionVar = variables.find((v) => v.name === 'users_collection');
    expect(usersCollectionVar).toEqual(
      expect.objectContaining({
        name: 'users_collection',
        type: 'JSON',
        children: expect.arrayContaining([
          expect.objectContaining({
            name: 'name',
            type: 'STRING',
          }),
        ]),
      }),
    );

    const otherVar = variables.find((v) => v.name === 'other_var');
    expect(otherVar).toEqual(
      expect.objectContaining({
        name: 'other_var',
        type: 'STRING',
      }),
    );

    expect(variables.find((v) => v.name === 'item')).toBeUndefined();
    expect(variables.find((v) => v.name === 'user_loop_var')).toBeUndefined();
    expect(variables.filter((v) => v.name === 'title' && v.type === 'JSON').length).toBe(0); // title should be a child, not a top-level JSON var
    expect(variables.filter((v) => v.name === 'name' && v.type === 'JSON').length).toBe(0); // name should be a child, not a top-level JSON var
  });

  it('should handle complex nested structures with children', () => {
    const template = `
      {% if user.isAdmin %}
        {% for role in user.roles %}
          {{ role.name }}
        {% endfor %}
        
        Settings: {{ settings.theme }}
      {% endif %}
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'user',
          type: 'JSON',
          children: expect.arrayContaining([
            expect.objectContaining({
              name: 'isAdmin',
              type: 'STRING',
            }),
            expect.objectContaining({
              name: 'roles',
              type: 'JSON',
              children: expect.arrayContaining([
                expect.objectContaining({
                  name: 'name',
                  type: 'STRING',
                }),
              ]),
            }),
          ]),
        }),
        expect.objectContaining({
          name: 'settings',
          type: 'JSON',
          children: [
            expect.objectContaining({
              name: 'theme',
              type: 'STRING',
            }),
          ],
        }),
      ]),
    );
    // Ensure 'name' (from role.name) is not a top-level variable
    const topLevelNameVar = variables.find(
      (v) => v.name === 'name' && v.type === 'STRING' && !v.children,
    );
    expect(topLevelNameVar).toBeUndefined();
  });

  it('should handle empty templates', () => {
    const { variables, error } = extractTemplateVariables('');
    expect(error).toBeUndefined();
    expect(variables).toEqual([]);
  });

  it('should handle invalid templates', () => {
    const template = `
      {% if unclosed
      {{ invalid }}
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeDefined();
    expect(variables).toEqual([]);
  });

  it('should handle variables used in both simple and complex contexts with children', () => {
    const template = `
      {{ user }}
      {{ user.name }}
      {% for item_loop in user.items %}
        {{ item_loop.title }}
      {% endfor %}
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'user',
          type: 'JSON',
          children: expect.arrayContaining([
            expect.objectContaining({
              name: 'name',
              type: 'STRING',
            }),
            expect.objectContaining({
              name: 'items',
              type: 'JSON',
              children: expect.arrayContaining([
                expect.objectContaining({
                  name: 'title',
                  type: 'STRING',
                }),
              ]),
            }),
          ]),
        }),
      ]),
    );
    const topLevelTitleVar = variables.find(
      (v) => v.name === 'title' && v.type === 'STRING' && !v.children,
    );
    expect(topLevelTitleVar).toBeUndefined();
  });

  it('should handle whitespace in variable names and their properties', () => {
    const template = `
      {{   spacedName   }}
      {{ spaced.  name  }}
    `;
    // Nunjucks appears to trim whitespace from symbol names during parsing,
    // so `spaced.  name  ` becomes `spaced.name`.
    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'spacedName', type: 'STRING' }),
        expect.objectContaining({
          name: 'spaced',
          type: 'JSON',
          children: [expect.objectContaining({ name: 'name', type: 'STRING' })],
        }),
      ]),
    );
  });

  it('should handle variables in complex expressions', () => {
    const template = `
      {{ "true" if foo else "false" }}
      {{ bar + 1 }}
      {{ baz | upper }}
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'foo', type: 'STRING' }),
        expect.objectContaining({ name: 'bar', type: 'STRING' }),
        expect.objectContaining({ name: 'baz', type: 'STRING' }),
      ]),
    );
  });

  // New tests moved from PromptService.test.ts and updated
  it('should correctly extract simple variables (new)', () => {
    const content = 'Hello {{ name }} and {{ age }}';
    const { variables, error } = extractTemplateVariables(content);
    expect(error).toBeUndefined();
    expect(variables).toHaveLength(2);
    expect(variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'name',
          type: 'STRING',
        }),
        expect.objectContaining({
          name: 'age',
          type: 'STRING',
        }),
      ]),
    );
  });

  it('should handle nested variables like user.first_name (new)', () => {
    const content = 'Hello {{ user.first_name }}!';
    const { variables, error } = extractTemplateVariables(content);
    expect(error).toBeUndefined();
    expect(variables).toHaveLength(1);
    const userVar = variables.find((v) => v.name === 'user');
    expect(userVar).toEqual({
      name: 'user',
      type: 'JSON',
      children: [
        {
          name: 'first_name',
          type: 'STRING',
        },
      ],
    });
  });

  it('should handle deeper nested variables like account.settings.theme (new)', () => {
    const content = 'Theme: {{ account.settings.theme }}';
    const { variables, error } = extractTemplateVariables(content);
    expect(error).toBeUndefined();
    expect(variables).toHaveLength(1);
    const accountVar = variables.find((v) => v.name === 'account');
    expect(accountVar).toEqual({
      name: 'account',
      type: 'JSON',
      children: [
        {
          name: 'settings',
          type: 'JSON',
          children: [
            {
              name: 'theme',
              type: 'STRING',
            },
          ],
        },
      ],
    });
  });

  it('should handle mixed simple and nested variables (new)', () => {
    const content = '{{ greeting }} {{ user.name }} from {{ user.location.city }}';
    const { variables, error } = extractTemplateVariables(content);
    expect(error).toBeUndefined();
    expect(variables).toHaveLength(2);

    const greetingVar = variables.find((v) => v.name === 'greeting');
    expect(greetingVar).toEqual({
      name: 'greeting',
      type: 'STRING',
    });

    const userVar = variables.find((v) => v.name === 'user');
    expect(userVar).toEqual({
      name: 'user',
      type: 'JSON',
      children: [
        { name: 'name', type: 'STRING' },
        {
          name: 'location',
          type: 'JSON',
          children: [{ name: 'city', type: 'STRING' }],
        },
      ],
    });
  });

  it('should correctly identify array variable in for loop as JSON (new)', () => {
    const content =
      '{% for item_loop_var in items_collection_new %}{{ item_loop_var.name }}{% endfor %}';
    const { variables, error } = extractTemplateVariables(content);
    expect(error).toBeUndefined();

    const itemsVar = variables.find((v) => v.name === 'items_collection_new');
    expect(itemsVar).toBeDefined();
    expect(itemsVar).toEqual(
      expect.objectContaining({
        name: 'items_collection_new',
        type: 'JSON',
        children: expect.arrayContaining([
          expect.objectContaining({
            name: 'name',
            type: 'STRING',
          }),
        ]),
      }),
    );
    expect(variables.find((v) => v.name === 'item_loop_var')).toBeUndefined();
    // Ensure 'name' (from item_loop_var.name) is not a top-level variable
    const topLevelNameVar = variables.find(
      (v) =>
        v.name === 'name' && v.type === 'STRING' && !v.children && v !== itemsVar?.children?.[0],
    );
    expect(topLevelNameVar).toBeUndefined();
  });

  it('should parse user.first_name and user.last_name into a single user object with two children (new)', () => {
    const content = 'hello {{ user.first_name }} {{ user.last_name }}';
    const { variables, error } = extractTemplateVariables(content);

    expect(error).toBeUndefined();
    expect(variables).toHaveLength(1);
    const userVar = variables[0];
    expect(userVar.name).toBe('user');
    expect(userVar.type).toBe('JSON');
    expect(userVar.children).toBeDefined();
    expect(userVar.children).toHaveLength(2);
    expect(userVar.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'first_name', type: 'STRING' }),
        expect.objectContaining({ name: 'last_name', type: 'STRING' }),
      ]),
    );
  });

  it('should handle a variable used as both an object and a simple variable (should be JSON) (new)', () => {
    const content = '{{ user.name }} and {{ user }}'; // user is used as object and then directly
    const { variables, error } = extractTemplateVariables(content);
    expect(error).toBeUndefined();
    expect(variables).toHaveLength(1);
    const userVar = variables.find((v) => v.name === 'user');
    expect(userVar).toBeDefined();
    expect(userVar?.type).toBe('JSON'); // Should be JSON because of user.name
    expect(userVar?.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'name', type: 'STRING' })]),
    );
  });
});

describe('validateVariables', () => {
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
    const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
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
    const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
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
    const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
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
    const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
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
    const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
      variables,
      variablesToCheck,
    );

    expect(missingRequiredVariables).toHaveLength(1);
    expect(missingRequiredVariables[0].name).toBe('req1');
    expect(variablesWithDefaults).toEqual({
      req2: 999,
      opt1: 'false', // Default applied
      opt2: 'overriddenOpt2', // Override applied
      // opt3 is missing as it wasn\'t provided and had no default
    });
  });

  it('should return empty results for empty inputs', () => {
    const variables: PromptVariable[] = [];
    const variablesToCheck = {};
    const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
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
    const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
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
    const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
      variables,
      variablesToCheck,
    );

    expect(missingRequiredVariables).toEqual([]);
    expect(variablesWithDefaults).toEqual({ opt1: 'a', opt2: '1' });
  });
});

describe('validateTemplate', () => {
  it('should return isValid: true for a valid template', () => {
    const template = 'Hello {{ name }}!';
    const result = validateTemplate(template);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return isValid: true for a template using 'global'", () => {
    const template = 'Version: {{ global.version }}';
    const result = validateTemplate(template);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return isValid: false for Nunjucks syntax errors', () => {
    const template = 'Hello {{ name !'; // Invalid Nunjucks syntax
    const result = validateTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/expected variable end/i);
  });

  it('should return isValid: false for disallowed identifiers', () => {
    const template = 'Data: {{ process.env.SECRET }}';
    const result = validateTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Security: Disallowed identifier 'process' found.");
  });

  it('should return isValid: false for another disallowed identifier (eval)', () => {
    const template = '{{ eval("alert(1)") }}';
    const result = validateTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Security: Disallowed identifier 'eval' found.");
  });

  it('should return isValid: false for disallowed property lookups', () => {
    const template = 'Access: {{ myObj.__proto__ }}';
    const result = validateTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Security: Disallowed property lookup '__proto__' found.");
  });

  it('should return isValid: false for disallowed property lookups via string literal', () => {
    const template = "Access: {{ myObj['constructor'] }}";
    const result = validateTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Security: Disallowed property lookup 'constructor' found.");
  });

  it('should allow legitimate property lookups that are not disallowed', () => {
    const template = 'Value: {{ myObj.legitProperty }}';
    const result = validateTemplate(template);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should handle complex but valid templates correctly', () => {
    const template = `
      {% if user.isAdmin %}
        Admin: {{ user.name }}
        {% for item in user.items %}
          {{ item.id }} - {{ item.value }}
        {% endfor %}
      {% else %}
        User: {{ user.name }}
      {% endif %}
    `;
    const result = validateTemplate(template);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('compilePrompt', () => {
  const baseMockVariables = {
    name: 'Tester',
    myObj: { legitProperty: 'hello' },
    global: { version: '1.0' },
  };

  it('should compile a valid prompt', () => {
    const template = 'Hello {{ name }}!';
    expect(() => compilePrompt(template, baseMockVariables)).not.toThrow();
    expect(compilePrompt(template, baseMockVariables)).toBe('Hello Tester!');
  });

  it("should compile a prompt using 'global' as it was removed from blacklist by user", () => {
    const template = 'Version: {{ global.version }}';
    expect(() => compilePrompt(template, baseMockVariables)).not.toThrow();
    // Ensure the output matches the global.version from baseMockVariables
    expect(compilePrompt(template, baseMockVariables)).toBe('Version: 1.0');
  });

  it('should throw error for disallowed identifiers', () => {
    const template = 'Data: {{ process.env.SECRET }}';
    expect(() => compilePrompt(template, baseMockVariables)).toThrow(
      "Security: Disallowed identifier 'process' found.",
    );
  });

  it('should throw error for disallowed property lookups', () => {
    const template = 'Access: {{ myObj.__proto__ }}';
    expect(() => compilePrompt(template, baseMockVariables)).toThrow(
      "Security: Disallowed property lookup '__proto__' found.",
    );
  });

  it('should throw error for Nunjucks syntax errors which cause parse fail in ensureSecureAst', () => {
    const template = 'Hello {{ name !'; // Invalid Nunjucks syntax
    expect(() => compilePrompt(template, baseMockVariables)).toThrow(
      'Template parsing failed: expected variable end',
    );
  });

  it("should allow mixed-case identifiers like 'Process' if not explicitly blacklisted (current check is case-sensitive)", () => {
    const template = 'Data: {{ Process.env.SECRET }}'; // 'Process' is not in DISALLOWED_IDENTIFIERS
    const result = validateTemplate(template);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();

    const specificMockVariables = {
      ...baseMockVariables,
      Process: { env: { SECRET: 'oops' } },
    };
    expect(() => compilePrompt(template, specificMockVariables)).not.toThrow();
    expect(compilePrompt(template, specificMockVariables)).toBe('Data: oops');
  });

  it('should allow deeply nested valid lookups', () => {
    const template = 'Deep: {{ a.b.c.d }}';
    const vars = { ...baseMockVariables, a: { b: { c: { d: 'value' } } } };
    expect(compilePrompt(template, vars)).toBe('Deep: value');
  });
});
