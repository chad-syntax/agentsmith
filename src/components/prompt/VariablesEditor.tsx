'use client';

import { IconTrash } from '@tabler/icons-react';
import { PromptVariable } from '@/components/editors/PromptContentEditor';
import { Database } from '@/app/__generated__/supabase.types';

type VariablesEditorProps = {
  variables: PromptVariable[];
  onVariablesChange: (variables: PromptVariable[]) => void;
  readOnly?: boolean;
};

export const VariablesEditor = (props: VariablesEditorProps) => {
  const { variables, onVariablesChange, readOnly = false } = props;

  const addVariable = () => {
    if (readOnly) return;
    onVariablesChange([
      ...variables,
      { name: '', type: 'STRING', required: true },
    ]);
  };

  const removeVariable = (index: number) => {
    if (readOnly) return;
    onVariablesChange(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (
    index: number,
    field: keyof PromptVariable,
    value: string | boolean
  ) => {
    if (readOnly) return;
    const newVariables = [...variables];
    newVariables[index] = {
      ...newVariables[index],
      [field]:
        field === 'type' && typeof value === 'string'
          ? (value.toUpperCase() as Database['public']['Enums']['variable_type'])
          : value,
    };
    onVariablesChange(newVariables);
  };

  return (
    <div className="space-y-4">
      {variables.map((variable, index) => (
        <div
          key={variable.id || `var-${index}`}
          className="bg-white p-4 rounded-lg border"
        >
          <div className="flex justify-between items-start mb-4">
            <input
              type="text"
              value={variable.name}
              onChange={(e) => updateVariable(index, 'name', e.target.value)}
              placeholder="Variable name"
              className="flex-1 px-2 py-1 border rounded-md mr-2"
              disabled={readOnly}
            />
            {!readOnly && (
              <button
                onClick={() => removeVariable(index)}
                className="p-1 text-gray-500 hover:text-red-500"
              >
                <IconTrash size={16} />
              </button>
            )}
          </div>
          <div className="space-y-2">
            <select
              value={variable.type}
              onChange={(e) => updateVariable(index, 'type', e.target.value)}
              className="w-full px-2 py-1 border rounded-md"
              disabled={readOnly}
            >
              <option value="STRING">String</option>
              <option value="NUMBER">Number</option>
              <option value="BOOLEAN">Boolean</option>
              <option value="JSON">JSON</option>
            </select>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={variable.required}
                onChange={(e) =>
                  updateVariable(index, 'required', e.target.checked)
                }
                className="mr-2"
                disabled={readOnly}
              />
              Required
            </label>
          </div>
        </div>
      ))}

      {variables.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">
          No variables found. Add variables to your prompt or edit template to
          add variables.
        </p>
      )}
    </div>
  );
};
