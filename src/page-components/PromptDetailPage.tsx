'use client';

import Link from 'next/link';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-django';
import 'prismjs/themes/prism.css';
import * as Collapsible from '@radix-ui/react-collapsible';
import { IconChevronRight, IconPlayerPlay } from '@tabler/icons-react';
import { useState } from 'react';
import { generateTypes } from '@/app/actions/generate-types';
import Editor from 'react-simple-code-editor';
import { getPromptById, getLatestPromptVersion } from '&/prompts';
import { Modal } from '@/components/ui/modal';
import { routes } from '@/utils/routes';
import { useApp } from '@/app/providers/app';
import type { NonStreamingChoice, OpenrouterResponse } from '@/lib/openrouter';
import { connectOpenrouter } from '@/app/actions/openrouter';

type FullResult = {
  completion: OpenrouterResponse;
  logUuid: string;
};

type PromptDetailPageProps = {
  prompt: NonNullable<Awaited<ReturnType<typeof getPromptById>>>;
  latestVersion: NonNullable<
    Awaited<ReturnType<typeof getLatestPromptVersion>>
  >;
};

export const PromptDetailPage = (props: PromptDetailPageProps) => {
  const { prompt, latestVersion } = props;

  const [isOpen, setIsOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [fullResult, setFullResult] = useState<FullResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isConnectOpenrouterModalOpen, setConnectOpenrouterModalOpen] =
    useState(false);
  const [isOpenRouterKeyModalOpen, setIsOpenRouterKeyModalOpen] =
    useState(false);
  const [testVariables, setTestVariables] = useState<Record<string, string>>(
    {}
  );

  const {
    selectedOrganizationUuid,
    selectedProjectUuid,
    hasOpenRouterKey,
    isOrganizationAdmin,
  } = useApp();

  const handleGenerateTypes = async () => {
    const response = await generateTypes();
    const blob = new Blob([response.content], { type: 'text/typescript' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleTestRun = async () => {
    setIsRunning(true);
    setTestResult(null);
    setFullResult(null);
    setRunError(null);

    try {
      const response = await fetch(`/api/v1/prompts/${prompt.uuid}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variables: testVariables }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run prompt');
      }

      const data: FullResult = await response.json();

      const result =
        (data.completion.choices[0] as NonStreamingChoice).message.content ||
        'No response content';

      setTestResult(result);
      setFullResult(data);
    } catch (error) {
      console.error('Error running prompt:', error);
      setRunError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setIsRunning(false);
      setIsTestModalOpen(false);
    }
  };

  const openTestModal = () => {
    // if the org doesn't have a key and the user is an admin, we connect the org to openrouter
    if (!hasOpenRouterKey && isOrganizationAdmin) {
      setConnectOpenrouterModalOpen(true);
      return;
    }

    if (!hasOpenRouterKey && !isOrganizationAdmin) {
      setIsOpenRouterKeyModalOpen(true);
      return;
    }

    // Initialize with empty values or default sample values
    const initialVariables: Record<string, string> = {};
    latestVersion.prompt_variables.forEach((variable) => {
      initialVariables[variable.name] = '';
    });
    setTestVariables(initialVariables);
    setIsTestModalOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <Link
              href={routes.studio.prompts(selectedProjectUuid)}
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back to Prompts
            </Link>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{prompt.name}</h1>
            <div className="space-x-4">
              <button
                onClick={handleGenerateTypes}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Generate Types
              </button>
              <button
                onClick={openTestModal}
                disabled={isRunning}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
              >
                {isRunning ? (
                  'Running...'
                ) : (
                  <>
                    <IconPlayerPlay size={16} />
                    Test Run
                  </>
                )}
              </button>
              <Link
                href={routes.studio.editPrompt(
                  selectedProjectUuid,
                  prompt.uuid
                )}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Edit Prompt
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            <Editor
              value={latestVersion.content}
              disabled
              onValueChange={() => {}}
              highlight={(code) => highlight(code, languages.django, 'django')}
              padding={16}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 14,
                minHeight: '500px',
              }}
              className="w-full"
            />
          </div>

          {(testResult || runError) && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Test Run Result</h2>
              <div className="bg-white rounded-lg border p-4 mb-4">
                <Link
                  className="text-blue-500 hover:text-blue-600"
                  href={routes.studio.logDetail(
                    selectedProjectUuid,
                    fullResult?.logUuid!
                  )}
                >
                  View Log
                </Link>
              </div>
              <div className="bg-white rounded-lg border p-4">
                {runError ? (
                  <div className="text-red-500">{runError}</div>
                ) : (
                  <>
                    <div className="whitespace-pre-wrap">{testResult}</div>
                    <div className="mt-4 border-t pt-4">
                      <h3 className="text-lg font-semibold mb-2">Raw Output</h3>
                      <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm">
                        {JSON.stringify(fullResult, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Collapsible.Root
        open={isOpen}
        onOpenChange={setIsOpen}
        className={`border-l bg-gray-50 transition-all duration-300 ${
          isOpen ? 'w-80' : 'w-12'
        }`}
      >
        <div className="p-4 border-b flex items-center">
          <Collapsible.Trigger asChild>
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <IconChevronRight
                className={`w-5 h-5 transition-transform ${
                  isOpen ? 'transform rotate-90' : ''
                }`}
              />
            </button>
          </Collapsible.Trigger>
          {isOpen && <span className="font-medium ml-2">Variables</span>}
        </div>
        <Collapsible.Content className="p-4">
          <div className="space-y-4">
            {latestVersion.prompt_variables.map((variable) => (
              <div key={variable.id} className="bg-white p-4 rounded-lg border">
                <div className="font-medium mb-2">{variable.name}</div>
                <div className="text-sm text-gray-500">
                  <p>Type: {variable.type}</p>
                  <p>Required: {variable.required ? 'Yes' : 'No'}</p>
                </div>
              </div>
            ))}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>

      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Test Prompt"
      >
        <div className="space-y-4">
          {latestVersion.prompt_variables.map((variable) => (
            <div key={variable.id}>
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

          <div className="mt-6">
            <button
              onClick={handleTestRun}
              disabled={isRunning}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              {isRunning ? 'Running...' : 'Run Test'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isConnectOpenrouterModalOpen}
        onClose={() => setConnectOpenrouterModalOpen(false)}
        title="Connect OpenRouter"
      >
        <div className="space-y-4">
          <p>
            You must connect your organization to openrouter to run completions
          </p>
          <button
            onClick={() => {
              connectOpenrouter(selectedOrganizationUuid);
              setConnectOpenrouterModalOpen(false);
            }}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Connect OpenRouter
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isOpenRouterKeyModalOpen}
        onClose={() => setIsOpenRouterKeyModalOpen(false)}
        title="OpenRouter Not Connected"
      >
        <div className="space-y-4">
          <p>
            Your organization admin must connect agentsmith to openrouter to run
            completions
          </p>
          <button
            onClick={() => setIsOpenRouterKeyModalOpen(false)}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Dismiss
          </button>
        </div>
      </Modal>
    </div>
  );
};
