import { extractTemplateVariables, validateVariables } from '../../src/utils/template-utils';
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
          required: true,
          default_value: null,
        }),
        expect.objectContaining({
          name: 'weather',
          type: 'STRING',
          required: true,
          default_value: null,
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
          required: true,
          default_value: null,
        }),
        expect.objectContaining({
          name: 'tired',
          type: 'STRING',
          required: true,
          default_value: null,
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
          required: true,
          default_value: null,
          children: [expect.objectContaining({ name: 'name', type: 'STRING' })],
        }),
        expect.objectContaining({
          name: 'settings',
          type: 'JSON',
          required: true,
          default_value: null,
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
        required: true,
        default_value: null,
        children: expect.arrayContaining([
          expect.objectContaining({
            name: 'title',
            type: 'STRING',
            required: true,
            default_value: null,
          }),
        ]),
      }),
    );

    const usersCollectionVar = variables.find((v) => v.name === 'users_collection');
    expect(usersCollectionVar).toEqual(
      expect.objectContaining({
        name: 'users_collection',
        type: 'JSON',
        required: true,
        default_value: null,
        children: expect.arrayContaining([
          expect.objectContaining({
            name: 'name',
            type: 'STRING',
            required: true,
            default_value: null,
          }),
        ]),
      }),
    );

    const otherVar = variables.find((v) => v.name === 'other_var');
    expect(otherVar).toEqual(
      expect.objectContaining({
        name: 'other_var',
        type: 'STRING',
        required: true,
        default_value: null,
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
              required: true,
              default_value: null,
            }),
            expect.objectContaining({
              name: 'roles',
              type: 'JSON',
              required: true,
              default_value: null,
              children: expect.arrayContaining([
                expect.objectContaining({
                  name: 'name',
                  type: 'STRING',
                  required: true,
                  default_value: null,
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
              required: true,
              default_value: null,
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
              required: true,
              default_value: null,
            }),
            expect.objectContaining({
              name: 'items',
              type: 'JSON',
              required: true,
              default_value: null,
              children: expect.arrayContaining([
                expect.objectContaining({
                  name: 'title',
                  type: 'STRING',
                  required: true,
                  default_value: null,
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
          required: true,
          default_value: null,
        }),
        expect.objectContaining({
          name: 'age',
          type: 'STRING',
          required: true,
          default_value: null,
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
      required: true,
      default_value: null,
      children: [
        {
          name: 'first_name',
          type: 'STRING',
          required: true,
          default_value: null,
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
      required: true,
      default_value: null,
      children: [
        {
          name: 'settings',
          type: 'JSON',
          required: true,
          default_value: null,
          children: [
            {
              name: 'theme',
              type: 'STRING',
              required: true,
              default_value: null,
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
      required: true,
      default_value: null,
    });

    const userVar = variables.find((v) => v.name === 'user');
    expect(userVar).toEqual({
      name: 'user',
      type: 'JSON',
      required: true,
      default_value: null,
      children: [
        { name: 'name', type: 'STRING', required: true, default_value: null },
        {
          name: 'location',
          type: 'JSON',
          required: true,
          default_value: null,
          children: [{ name: 'city', type: 'STRING', required: true, default_value: null }],
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
        required: true,
        default_value: null,
        children: expect.arrayContaining([
          expect.objectContaining({
            name: 'name',
            type: 'STRING',
            required: true,
            default_value: null,
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
