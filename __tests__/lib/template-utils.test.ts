import {
  extract,
  validateVariables,
  validateTemplate,
  compilePrompt,
} from '../../src/utils/template-utils';
import { Database } from '../../src/app/__generated__/supabase.types';

type PromptVariable = Database['public']['Tables']['prompt_variables']['Row'];

describe('extractTemplateVariables', () => {
  it('should extract simple variables', () => {
    const template = `
      Hello {{ name }}!
      The weather is {{ weather }}.
    `;

    const { variables, error } = extract(template);
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

    const { variables, error } = extract(template);
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

    const { variables, error } = extract(template);
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

    const { variables, error } = extract(template);
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

    const { variables, error } = extract(template);
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
    const { variables, error } = extract('');
    expect(error).toBeUndefined();
    expect(variables).toEqual([]);
  });

  it('should handle invalid templates', () => {
    const template = `
      {% if unclosed
      {{ invalid }}
    `;

    const { variables, error } = extract(template);
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

    const { variables, error } = extract(template);
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
    const { variables, error } = extract(template);
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

    const { variables, error } = extract(template);
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
    const { variables, error } = extract(content);
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
    const { variables, error } = extract(content);
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
    const { variables, error } = extract(content);
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
    const { variables, error } = extract(content);
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
    const { variables, error } = extract(content);
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
    const { variables, error } = extract(content);

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
    const { variables, error } = extract(content);
    expect(error).toBeUndefined();
    expect(variables).toHaveLength(1);
    const userVar = variables.find((v) => v.name === 'user');
    expect(userVar).toBeDefined();
    expect(userVar?.type).toBe('JSON'); // Should be JSON because of user.name
    expect(userVar?.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'name', type: 'STRING' })]),
    );
  });

  it('should not count filters as variables', () => {
    const content = '{{ name | upper }}';
    const { variables, error } = extract(content);
    expect(error).toBeUndefined();
    expect(variables).toHaveLength(1);
    expect(variables).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'name', type: 'STRING' })]),
    );
  });

  it('should not count filters as variables, but should count variables that are used in filters (replace example)', () => {
    const content = `
      {% set numbers = 123456 %}
      {{ numbers | replace(target, ".") }}
    `;
    const { variables, error } = extract(content);
    expect(error).toBeUndefined();
    // Only 'numbers' and 'target' should be extracted as a variable (from the output expression)
    expect(variables).toHaveLength(2);
    expect(variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'numbers', type: 'STRING' }),
        expect.objectContaining({ name: 'target', type: 'STRING' }),
      ]),
    );
  });
});

describe('extractTemplateIncludes', () => {
  it('should extract includes', () => {
    const template = `
      Hello world!
      {% include "prompt-1" %}
    `;
    const { includes } = extract(template);
    expect(includes).toEqual([{ arg: 'prompt-1', slug: 'prompt-1', version: null }]);
  });

  it('should extract includes with version', () => {
    const template = `
      Hello world!
      {% include "prompt-1@1.0.0" %}
    `;
    const { includes } = extract(template);
    expect(includes).toEqual([{ arg: 'prompt-1@1.0.0', slug: 'prompt-1', version: '1.0.0' }]);
  });

  it('should extract includes with a latest version identifier', () => {
    const template = `
      Hello world!
      {% include "prompt-1@latest" %}
    `;
    const { includes } = extract(template);
    expect(includes).toEqual([{ arg: 'prompt-1@latest', slug: 'prompt-1', version: 'latest' }]);
  });

  it('should extract multiple includes', () => {
    const template = `
      Hello world!
      {% include "prompt-1@1.0.0" %}
      {% include "prompt-2@latest" %}
      {% include "prompt-3" %}
    `;
    const { includes } = extract(template);
    expect(includes).toEqual([
      { arg: 'prompt-1@1.0.0', slug: 'prompt-1', version: '1.0.0' },
      { arg: 'prompt-2@latest', slug: 'prompt-2', version: 'latest' },
      { arg: 'prompt-3', slug: 'prompt-3', version: null },
    ]);
  });

  it('should extract duplicate includes with different versions', () => {
    const template = `
      {% include "prompt-1@1.0.0" %}
      {% include "prompt-1@1.0.1" %}
    `;
    const { includes } = extract(template);
    expect(includes).toEqual([
      { arg: 'prompt-1@1.0.0', slug: 'prompt-1', version: '1.0.0' },
      { arg: 'prompt-1@1.0.1', slug: 'prompt-1', version: '1.0.1' },
    ]);
  });

  it('should throw an error if the include has an invalid semver', () => {
    const template = `
      {% include "prompt-1@1.0" %}
    `;
    const { includes, error } = extract(template);
    expect(error).toBeDefined();
    expect(includes).toEqual([]);
  });

  it('should throw an error if the include is missing an identifier', () => {
    const template = `
      {% include "@1.0.0" %}
    `;
    const { includes, error } = extract(template);
    expect(error).toBeDefined();
    expect(includes).toEqual([]);
  });

  it('should throw an error if the include is not a string', () => {
    const template = `
      {% include 1 %}
    `;
    const { includes, error } = extract(template);
    expect(error).toBeDefined();
    expect(includes).toEqual([]);
  });

  it('should throw an error if the include is missing double quotes', () => {
    const template = `
      {% include prompt-1@1.0.0 %}
    `;
    const { includes, error } = extract(template);
    expect(error).toBeDefined();
    expect(includes).toEqual([]);
  });

  it('should throw an error if the include is missing a version', () => {
    const template = `
      {% include "prompt-1@" %}
    `;
    const { includes, error } = extract(template);
    expect(error).toBeDefined();
    expect(includes).toEqual([]);
  });

  it('should throw an error if the include has an invalid semver', () => {
    const template = `
      Hello world!
      {% include "prompt-1@1.0.0.0" %}
    `;
    const { includes, error } = extract(template);
    expect(error).toBeDefined();
    expect(includes).toEqual([]);
  });

  it('should throw an error if the include is missing an identifier', () => {
    const template = `
      Hello world!
      {% include %}
    `;
    const { includes, error } = extract(template);
    expect(error).toBeDefined();
    expect(includes).toEqual([]);
  });

  it('should throw an error if the include is not a string', () => {
    const template = `
      Hello world!
      {% include 123 %}
    `;
    const { includes, error } = extract(template);
    expect(error).toBeDefined();
    expect(includes).toEqual([]);
  });

  it('should throw an error if the include is missing double quotes', () => {
    const template = `
      Hello world!
      {% include prompt-1 %}
    `;
    const { includes, error } = extract(template);
    expect(error).toBeDefined();
    expect(includes).toEqual([]);
  });

  it('should throw an error if the include is missing a version', () => {
    const template = `
      Hello world!
      {% include "prompt-1@" %}
    `;
    const { includes, error } = extract(template);
    expect(error).toBeDefined();
    expect(includes).toEqual([]);
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

  const noopPromptLoader = () => '';
  const promptLoader = (slug: string, version: string | null) => {
    if (slug === 'included-prompt' && version === '0.0.1') {
      return 'Hello from included prompt!';
    }
    if (slug === 'included-prompt' && (version === null || version === 'latest')) {
      return 'Hello from latest included prompt!';
    }
    if (slug === 'support-chat' && version === null) {
      return 'Hello from support chat!';
    }
    throw new Error(`Included prompt ${slug}@${version} not found`);
  };

  it('should compile a valid prompt', () => {
    const template = 'Hello {{ name }}!';
    expect(compilePrompt(template, baseMockVariables, noopPromptLoader)).toBe('Hello Tester!');
  });

  it("should compile a prompt using 'global' as it was removed from blacklist by user", () => {
    const template = 'Version: {{ global.version }}';
    // Ensure the output matches the global.version from baseMockVariables
    expect(compilePrompt(template, baseMockVariables, noopPromptLoader)).toBe('Version: 1.0');
  });

  it('should throw error for disallowed identifiers', () => {
    const template = 'Data: {{ process.env.SECRET }}';
    expect(() => compilePrompt(template, baseMockVariables, noopPromptLoader)).toThrow(
      "Security: Disallowed identifier 'process' found.",
    );
  });

  it('should throw error for disallowed property lookups', () => {
    const template = 'Access: {{ myObj.__proto__ }}';
    expect(() => compilePrompt(template, baseMockVariables, noopPromptLoader)).toThrow(
      "Security: Disallowed property lookup '__proto__' found.",
    );
  });

  it('should throw error for Nunjucks syntax errors which cause parse fail in ensureSecureAst', () => {
    const template = 'Hello {{ name !'; // Invalid Nunjucks syntax
    expect(() => compilePrompt(template, baseMockVariables, noopPromptLoader)).toThrow(
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
    expect(compilePrompt(template, specificMockVariables, noopPromptLoader)).toBe('Data: oops');
  });

  it('should allow deeply nested valid lookups', () => {
    const template = 'Deep: {{ a.b.c.d }}';
    const vars = { ...baseMockVariables, a: { b: { c: { d: 'value' } } } };
    expect(compilePrompt(template, vars, noopPromptLoader)).toBe('Deep: value');
  });

  it('should compile a prompt with an included prompt with a specific version', () => {
    const template = '{% include "included-prompt@0.0.1" %}';

    expect(compilePrompt(template, baseMockVariables, promptLoader)).toBe(
      'Hello from included prompt!',
    );
  });

  it('should compile a prompt with an included prompt with the latest version if no version is specified', () => {
    const template = '{% include "included-prompt" %}';

    expect(compilePrompt(template, baseMockVariables, promptLoader)).toBe(
      'Hello from latest included prompt!',
    );
  });

  it('should compile a prompt with an included prompt with the latest version if the version is "latest"', () => {
    const template = '{% include "included-prompt@latest" %}';
    expect(compilePrompt(template, baseMockVariables, promptLoader)).toBe(
      'Hello from latest included prompt!',
    );
  });

  it('should compile a prompt with multiple included prompts', () => {
    const template = '{% include "included-prompt@0.0.1" %} {% include "support-chat" %}';

    expect(compilePrompt(template, baseMockVariables, promptLoader)).toBe(
      'Hello from included prompt! Hello from support chat!',
    );
  });

  it('should throw an error if an included prompt is not found', () => {
    const template = '{% include "non-existent-prompt" %}';
    expect(() => compilePrompt(template, baseMockVariables, promptLoader)).toThrow(
      '(unknown path)\n  Error: Included prompt non-existent-prompt@null not found',
    );
  });
});
