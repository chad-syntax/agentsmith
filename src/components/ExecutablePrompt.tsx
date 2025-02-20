import { useState } from 'react';
import type { PromptVariable } from '@/app/constants';

type ExecutablePromptProps = {
  name: string;
  id: string;
  variables: PromptVariable[];
  onExecute: (variables: Record<string, string>) => Promise<void>;
  isAction?: boolean;
};

export const ExecutablePrompt = ({
  name,
  id,
  variables,
  onExecute,
  isAction = true,
}: ExecutablePromptProps) => {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    setIsExecuting(true);
    setError(null);
    setResponse(null);

    try {
      await onExecute(inputValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute');
    } finally {
      setIsExecuting(false);
    }
  };

  const isValid = variables.every(
    (variable) => !variable.required || inputValues[variable.name]
  );

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="font-medium text-lg mb-2">{name}</h3>
      <div className="space-y-4">
        {variables.map((variable) => (
          <div key={variable.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {variable.name}
              {variable.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            {variable.type === 'string' && (
              <textarea
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={inputValues[variable.name] || ''}
                onChange={(e) =>
                  setInputValues((prev) => ({
                    ...prev,
                    [variable.name]: e.target.value,
                  }))
                }
                rows={3}
              />
            )}
            {variable.type === 'number' && (
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={inputValues[variable.name] || ''}
                onChange={(e) =>
                  setInputValues((prev) => ({
                    ...prev,
                    [variable.name]: e.target.value,
                  }))
                }
              />
            )}
            {variable.type === 'boolean' && (
              <select
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={inputValues[variable.name] || ''}
                onChange={(e) =>
                  setInputValues((prev) => ({
                    ...prev,
                    [variable.name]: e.target.value,
                  }))
                }
              >
                <option value="">Select...</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            )}
          </div>
        ))}

        <div className="mt-4">
          <button
            onClick={handleExecute}
            disabled={!isValid || isExecuting}
            className={`px-4 py-2 rounded-md text-white ${
              !isValid || isExecuting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isExecuting
              ? 'Executing...'
              : `Execute ${isAction ? 'Action' : 'Reaction'}`}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {response && (
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">Response:</h4>
            <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-auto">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
