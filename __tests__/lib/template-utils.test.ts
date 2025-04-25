import { extractTemplateVariables } from '../../src/utils/template-utils';

describe('extractTemplateVariables', () => {
  it('should extract simple variables', () => {
    const template = `
      Hello {{ name }}!
      The weather is {{ weather }}.
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toEqual([
      { name: 'name', type: 'STRING', required: true, default_value: null },
      { name: 'weather', type: 'STRING', required: true, default_value: null },
    ]);
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
    expect(variables).toEqual([
      { name: 'hungry', type: 'STRING', required: true, default_value: null },
      { name: 'tired', type: 'STRING', required: true, default_value: null },
    ]);
  });

  it('should mark variables with dot notation as JSON type', () => {
    const template = `
      {{ user.name }}
      {{ settings.theme.color }}
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toEqual([
      { name: 'user', type: 'JSON', required: true, default_value: null },
      { name: 'settings', type: 'JSON', required: true, default_value: null },
    ]);
  });

  it('should mark collection variables as JSON type and exclude loop variables', () => {
    const template = `
      {% for item in items %}
        <li>{{ item.title }}</li>
      {% else %}
        <li>This would display if the 'items' collection were empty</li>
      {% endfor %}

      {% for user in users %}
        {{ user.name }}
      {% endfor %}
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toEqual([
      { name: 'items', type: 'JSON', required: true, default_value: null },
      { name: 'users', type: 'JSON', required: true, default_value: null },
    ]);
  });

  it('should handle complex nested structures', () => {
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
    expect(variables).toEqual([
      { name: 'user', type: 'JSON', required: true, default_value: null },
      { name: 'settings', type: 'JSON', required: true, default_value: null },
    ]);
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

  it('should handle variables used in both simple and complex contexts', () => {
    const template = `
      {{ user }}
      {{ user.name }}
      {% for item in user.items %}
        {{ item.title }}
      {% endfor %}
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toEqual([
      { name: 'user', type: 'JSON', required: true, default_value: null },
    ]);
  });

  it('should handle whitespace in variable names', () => {
    const template = `
      {{   spacedName   }}
      {{ spaced.  name  }}
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toEqual([
      { name: 'spacedName', type: 'STRING', required: true, default_value: null },
      { name: 'spaced', type: 'JSON', required: true, default_value: null },
    ]);
  });

  it('should handle variables in complex expressions', () => {
    const template = `
      {{ "true" if foo else "false" }}
      {{ bar + 1 }}
      {{ baz | upper }}
    `;

    const { variables, error } = extractTemplateVariables(template);
    expect(error).toBeUndefined();
    expect(variables).toEqual([
      { name: 'foo', type: 'STRING', required: true, default_value: null },
      { name: 'bar', type: 'STRING', required: true, default_value: null },
      { name: 'baz', type: 'STRING', required: true, default_value: null },
    ]);
  });
});
