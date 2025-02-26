'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { __DUMMY_PROMPTS__ } from '@/app/constants';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-django';
import 'prismjs/themes/prism.css';
import * as Collapsible from '@radix-ui/react-collapsible';
import { IconChevronRight, IconPlayerPlay } from '@tabler/icons-react';
import { useState } from 'react';
import { generateTypes } from '@/app/actions/generate-types';
import Editor from 'react-simple-code-editor';

type RunResponseData = {
  completion: {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  };
};

export default function PromptDetailPage() {
  const params = useParams();
  const promptId = params.id as string;
  const prompt = __DUMMY_PROMPTS__[promptId];
  const [isOpen, setIsOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

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
    if (!prompt) return;

    // Create dummy data based on the prompt's variables
    const dummyVariables: Record<string, string> = {};
    prompt.variables.forEach((variable) => {
      dummyVariables[variable.name] = `Sample ${variable.name} value`;
    });

    setIsRunning(true);
    setRunResult(null);
    setRunError(null);

    try {
      const response = await fetch(`/api/v1/prompts/${promptId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variables: dummyVariables }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run prompt');
      }

      const data: RunResponseData = await response.json();
      const result =
        data.completion.choices[0]?.message.content || 'No response content';

      setRunResult(result);
    } catch (error) {
      console.error('Error running prompt:', error);
      setRunError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setIsRunning(false);
    }
  };

  if (!prompt) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Prompt Not Found</h1>
        <p className="text-gray-600 mb-4">
          The prompt you're looking for doesn't exist.
        </p>
        <Link href="/app/prompts" className="text-blue-500 hover:text-blue-600">
          ← Back to Prompts
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <Link
              href="/app/prompts"
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
                onClick={handleTestRun}
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
                href={`/app/prompts/${prompt.id}/edit`}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Edit Prompt
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            <Editor
              value={prompt.content}
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

          {(runResult || runError) && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Test Run Result</h2>
              <div className="bg-white rounded-lg border p-4">
                {runError ? (
                  <div className="text-red-500">{runError}</div>
                ) : (
                  <div className="whitespace-pre-wrap">{runResult}</div>
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
            {prompt.variables.map((variable, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border">
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
    </div>
  );
}
