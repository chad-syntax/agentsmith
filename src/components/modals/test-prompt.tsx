'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/providers/app';
import { NonStreamingChoice } from '@/lib/openrouter';
import { connectOpenrouter } from '@/app/actions/openrouter';
import { routes } from '@/utils/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { JsonEditor } from '../editors/json-editor';
import merge from 'lodash.merge';
import { streamToIterator } from '@/utils/stream-to-iterator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownEditor } from '../editors/markdown-editor';
import { MarkdownRenderer } from '../markdown-renderer';
import { ExecutePromptResponseError } from '@/types/api-responses';
import { usePromptPage } from '@/providers/prompt-page';
import { PromptContentEditor } from '../editors/prompt-editor';

const TABS = {
  content: 'content',
  compiledPrompt: 'compiledPrompt',
  markdown: 'markdown',
  response: 'response',
} as const;

const TAB_LABELS = {
  content: 'Content',
  compiledPrompt: 'Compiled Prompt',
  markdown: 'Markdown',
  response: 'Response',
} as const;

type Tab = keyof typeof TABS;

export const PromptTestModal = () => {
  const { state, closeTestModal, setInputVariables } = usePromptPage();
  const {
    currentVersion,
    mergedIncludedVariables,
    isTestModalOpen: isOpen,
    inputVariables,
    compiledPrompt,
  } = state;

  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [fullResult, setFullResult] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<Tab>(TABS.content);

  const { selectedOrganizationUuid, hasOpenRouterKey, isOrganizationAdmin, selectedProjectUuid } =
    useApp();

  const { setOnboardingChecklist } = useApp();

  const handleTestPrompt = async () => {
    setIsRunning(true);
    setTestResult(null);
    setFullResult(null);
    setTestError(null);

    try {
      const response = await fetch(routes.api.v1.executePromptVersion(currentVersion.uuid), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variables: inputVariables,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ExecutePromptResponseError;

        if (errorData.missingGlobalContext) {
          setTestError(
            `Missing global context variables: ${errorData.missingGlobalContext.join(', ')}`,
          );
          return;
        }

        if (errorData.missingRequiredVariables) {
          setTestError(
            `Missing required variables: ${errorData.missingRequiredVariables.map((v) => v.name).join(', ')}`,
          );
          return;
        }

        throw new Error(errorData.error || 'Failed to run prompt');
      }

      if ((currentVersion.config as any)?.stream && response.body) {
        let fullResult: any = {};
        let content = '';

        try {
          const stream = streamToIterator(response.body);
          for await (const event of stream) {
            if (event.type === 'logUuid') {
              if (event.data.logUuid) {
                fullResult.logUuid = event.data.logUuid;
              }
            } else {
              const chunk = event.data;
              // usage chunk contains null stop values we don't want to merge
              if (chunk.usage) {
                fullResult.completion.usage = merge(fullResult.completion.usage, chunk.usage);
              } else if (chunk.choices) {
                content += chunk.choices[0].delta.content ?? '';
                setTestResult(content);
              }
              fullResult.completion = merge(fullResult.completion, chunk);
            }
          }

          if (fullResult.completion.choices?.[0]) {
            delete fullResult.completion.choices[0].delta;
            fullResult.completion.choices[0].message = {
              role: 'assistant',
              content,
            };
          }

          setFullResult(fullResult);
        } catch (error) {
          console.error('Error testing prompt:', error);
          setTestError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
          setIsRunning(false);
        }

        return;
      }

      const data = await response.json();

      const result =
        (data.completion.choices[0] as NonStreamingChoice).message.content || 'No response content';

      setTestResult(result);
      setFullResult(data);
    } catch (error) {
      console.error('Error testing prompt:', error);
      setTestError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
      setOnboardingChecklist((prev) => (!prev ? null : { ...prev, promptTested: true }));
    }
  };

  const resetTest = () => {
    setInputVariables({});
    setTestResult(null);
    setFullResult(null);
    setTestError(null);
  };

  // If no OpenRouter key is configured, show the connection UI instead
  if (!hasOpenRouterKey) {
    return (
      <Dialog open={isOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect OpenRouter</DialogTitle>
            <DialogDescription>
              {isOrganizationAdmin
                ? 'You must connect your organization to OpenRouter to run completions.'
                : 'Your organization admin must connect Agentsmith to OpenRouter to run completions.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isOrganizationAdmin ? (
              <Button
                onClick={() => {
                  connectOpenrouter(selectedOrganizationUuid);
                  closeTestModal();
                }}
                className="w-full"
              >
                Connect OpenRouter
              </Button>
            ) : (
              <Button variant="secondary" onClick={closeTestModal} className="w-full">
                Dismiss
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  let isContentJson = false;
  try {
    JSON.parse(testResult as string);
    isContentJson = true;
  } catch (error) {
    //
  }

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && closeTestModal()}>
      <DialogContent className="max-w-full max-h-full rounded-none sm:rounded-lg sm:max-w-[calc(98%-2rem)] h-full sm:max-h-[calc(98%-2rem)] flex flex-col flex-start overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            Test&nbsp;
            <span className="px-2 py-1 bg-muted rounded-md">
              {currentVersion.prompts.name}@{currentVersion.version}
            </span>
          </DialogTitle>
          <DialogDescription>
            Enter the required variables below to test your prompt.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-col md:flex-row flex-1 flex gap-4">
          <div className="md:flex-1 space-y-4">
            <h3 className="font-medium text-lg">Input Variables</h3>
            {mergedIncludedVariables.map((variable) => (
              <div key={variable.id || variable.name} className="space-y-2">
                <Label className="ml-1.5 gap-1 flex items-start">
                  {variable.name}
                  {variable.required && <span className="text-destructive -mt-0.5">*</span>}
                </Label>
                <div className="px-1">
                  {variable.type === 'JSON' ? (
                    <JsonEditor
                      value={inputVariables[variable.name] as object}
                      onChange={(value) => {
                        setInputVariables({
                          ...inputVariables,
                          [variable.name]: value,
                        });
                      }}
                      minHeight="100%"
                    />
                  ) : (
                    <Input
                      type={variable.type === 'NUMBER' ? 'number' : 'text'}
                      value={(inputVariables[variable.name] as string) || ''}
                      onChange={(e) => {
                        setInputVariables({
                          ...inputVariables,
                          [variable.name]: e.target.value,
                        });
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
            {testError && (
              <Alert variant="destructive">
                <AlertDescription>{testError}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-3">
              <Button
                onClick={handleTestPrompt}
                disabled={isRunning}
                className="flex-1"
                variant="default"
              >
                {isRunning ? 'Running...' : 'Run Test'}
              </Button>
              {testResult && (
                <Button onClick={resetTest} variant="outline">
                  Reset
                </Button>
              )}
            </div>
          </div>
          <div className="md:flex-3 max-h-[calc(100vh-14rem)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-medium text-lg">Test Results</h3>
              {fullResult?.logUuid && (
                <div className="text-sm">
                  <Link
                    href={routes.studio.logDetail(selectedProjectUuid, fullResult.logUuid)}
                    target="_blank"
                    className="text-blue-500 hover:underline"
                  >
                    View detailed execution log →
                  </Link>
                </div>
              )}
            </div>

            {testResult ? (
              <Tabs
                value={selectedTab}
                onValueChange={(value) => setSelectedTab(value as Tab)}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <TabsList className="w-full md:w-xl rounded-md">
                  {Object.entries(TABS).map(([key, value]) => (
                    <TabsTrigger key={key} className="cursor-pointer rounded-md" value={value}>
                      {TAB_LABELS[value]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value={TABS.compiledPrompt} className="flex-1 overflow-auto">
                  <PromptContentEditor
                    onContentChange={() => {}}
                    content={compiledPrompt}
                    readOnly
                    minHeight="100%"
                  />
                </TabsContent>
                <TabsContent value={TABS.content} className="flex-1 overflow-auto">
                  {isContentJson ? (
                    <JsonEditor
                      value={JSON.parse(testResult as string)}
                      readOnly
                      minHeight="100%"
                    />
                  ) : (
                    <MarkdownEditor value={testResult} readOnly minHeight="100%" />
                  )}
                </TabsContent>
                <TabsContent value={TABS.markdown} className="flex-1 overflow-auto">
                  <div className="p-4 border rounded-md">
                    <MarkdownRenderer>{testResult}</MarkdownRenderer>
                  </div>
                </TabsContent>
                <TabsContent value={TABS.response} className="flex-1 overflow-auto">
                  <JsonEditor value={fullResult} readOnly minHeight="100%" />
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="text-center">
                <CardContent>Results will appear here.</CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
