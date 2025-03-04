'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/modal';
import { PromptVariable } from '@/components/editors/PromptContentEditor';
import { useApp } from '@/app/providers/app';
import { NonStreamingChoice, OpenrouterResponse } from '@/lib/openrouter';
import { connectOpenrouter } from '@/app/actions/openrouter';
import { routes } from '@/utils/routes';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

type PromptTestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  variables: PromptVariable[];
  promptUuid: string;
};

export const PromptTestModal = (props: PromptTestModalProps) => {
  const { isOpen, onClose, variables, promptUuid } = props;

  const [testVariables, setTestVariables] = useState<Record<string, string>>(
    {}
  );
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [fullResult, setFullResult] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [showRawOutput, setShowRawOutput] = useState(false);

  const {
    selectedOrganizationUuid,
    hasOpenRouterKey,
    isOrganizationAdmin,
    selectedProjectUuid,
  } = useApp();

  const handleTestPrompt = async () => {
    setIsRunning(true);
    setTestResult(null);
    setFullResult(null);
    setTestError(null);

    try {
      const response = await fetch(`/api/v1/prompts/${promptUuid}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variables: testVariables,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run prompt');
      }

      const data = await response.json();

      const result =
        (data.completion.choices[0] as NonStreamingChoice).message.content ||
        'No response content';

      setTestResult(result);
      setFullResult(data);
    } catch (error) {
      console.error('Error testing prompt:', error);
      setTestError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setIsRunning(false);
    }
  };

  const resetTest = () => {
    setTestResult(null);
    setFullResult(null);
    setTestError(null);
  };

  // If no OpenRouter key is configured, show the connection UI instead
  if (!hasOpenRouterKey) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Connect OpenRouter">
        <div className="space-y-4">
          {isOrganizationAdmin ? (
            <>
              <p>
                You must connect your organization to OpenRouter to run
                completions.
              </p>
              <button
                onClick={() => {
                  connectOpenrouter(selectedOrganizationUuid);
                  onClose();
                }}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Connect OpenRouter
              </button>
            </>
          ) : (
            <>
              <p>
                Your organization admin must connect Agentsmith to OpenRouter to
                run completions.
              </p>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Test Prompt">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Input section */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Input Variables</h3>
          {variables.map((variable) => (
            <div key={variable.id || variable.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {variable.name}
                {variable.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={variable.type === 'NUMBER' ? 'number' : 'text'}
                value={testVariables[variable.name] || ''}
                onChange={(e) => {
                  setTestVariables({
                    ...testVariables,
                    [variable.name]: e.target.value,
                  });
                }}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          ))}

          {testError && (
            <div className="mt-4 text-red-500 p-3 bg-red-50 rounded-md">
              {testError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleTestPrompt}
              disabled={isRunning}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              {isRunning ? 'Running...' : 'Run Test'}
            </button>
            {testResult && (
              <button
                onClick={resetTest}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Results section */}
        {testResult && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium text-lg mb-4">Test Results</h3>

            {fullResult?.logUuid && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4 flex justify-between items-center">
                <span className="text-sm text-blue-800">
                  View detailed logs and information
                </span>
                <Link
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  href={routes.studio.logDetail(
                    selectedProjectUuid,
                    fullResult.logUuid
                  )}
                  target="_blank"
                >
                  View Log →
                </Link>
              </div>
            )}

            <div className="bg-white rounded-lg border p-4 mb-4">
              <h4 className="font-medium mb-2">Response</h4>
              <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md max-h-[300px] overflow-auto">
                {testResult}
              </div>
            </div>

            <div>
              <button
                onClick={() => setShowRawOutput(!showRawOutput)}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-2"
              >
                {showRawOutput ? (
                  <IconChevronDown size={16} />
                ) : (
                  <IconChevronRight size={16} />
                )}
                <span className="text-sm font-medium">Raw Output</span>
              </button>

              {showRawOutput && (
                <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm max-h-[400px]">
                  {JSON.stringify(fullResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
