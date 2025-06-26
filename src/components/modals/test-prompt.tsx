'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/providers/app';
import { NonStreamingChoice } from '@/lib/openrouter';
import { connectOpenrouter } from '@/app/actions/openrouter';
import { routes } from '@/utils/routes';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JsonEditor } from '../editors/json-editor';
import { EditorPromptVariable } from '@/types/prompt-editor';
import { Database } from '@/app/__generated__/supabase.types';
import merge from 'lodash.merge';
import { streamToIterator } from '@/utils/stream-to-iterator';

type PromptVersion = Database['public']['Tables']['prompt_versions']['Row'] & {
  prompts: Database['public']['Tables']['prompts']['Row'];
  prompt_variables: Database['public']['Tables']['prompt_variables']['Row'][];
};

type PromptTestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  variables: EditorPromptVariable[];
  promptVersion: PromptVersion;
};

export const PromptTestModal = (props: PromptTestModalProps) => {
  const { isOpen, onClose, variables, promptVersion } = props;

  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [fullResult, setFullResult] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [showRawOutput, setShowRawOutput] = useState(false);

  const { selectedOrganizationUuid, hasOpenRouterKey, isOrganizationAdmin, selectedProjectUuid } =
    useApp();

  const handleTestPrompt = async () => {
    setIsRunning(true);
    setTestResult(null);
    setFullResult(null);
    setTestError(null);

    try {
      const response = await fetch(routes.api.v1.executePromptVersion(promptVersion.uuid), {
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

        if (errorData.missingGlobalContext) {
          setTestError(
            `Missing global context variables: ${errorData.missingGlobalContext.join(', ')}`,
          );
          return;
        }

        throw new Error(errorData.error || 'Failed to run prompt');
      }

      if ((promptVersion.config as any)?.stream && response.body) {
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
      <Dialog open={isOpen} onOpenChange={onClose}>
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
                  onClose();
                }}
                className="w-full"
              >
                Connect OpenRouter
              </Button>
            ) : (
              <Button variant="secondary" onClick={onClose} className="w-full">
                Dismiss
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full rounded-none sm:rounded-lg sm:max-w-[calc(95%-2rem)] h-full sm:max-h-[calc(95%-2rem)] flex flex-col flex-start overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            Test&nbsp;
            <span className="px-2 py-1 bg-muted rounded-md">
              {promptVersion.prompts.name}@{promptVersion.version}
            </span>
          </DialogTitle>
          <DialogDescription>
            Enter the required variables below to test your prompt.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-col md:flex-row flex-1 flex gap-4">
          <div className="md:flex-1 space-y-4">
            <h3 className="font-medium text-lg">Input Variables</h3>
            {variables.map((variable) => (
              <div key={variable.id || variable.name} className="space-y-2">
                <Label className="ml-1.5 gap-1 flex items-start">
                  {variable.name}
                  {variable.required && <span className="text-destructive -mt-0.5">*</span>}
                </Label>
                <div className="px-1">
                  <Input
                    type={variable.type === 'NUMBER' ? 'number' : 'text'}
                    value={testVariables[variable.name] || ''}
                    onChange={(e) => {
                      setTestVariables({
                        ...testVariables,
                        [variable.name]: e.target.value,
                      });
                    }}
                  />
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
            <div>
              <h3 className="font-medium text-lg mb-4">Test Results</h3>
              {fullResult?.logUuid && (
                <Alert className="mb-4">
                  <AlertDescription className="flex justify-between items-center">
                    <span>View detailed execution log</span>
                    <Button variant="link" asChild className="p-0">
                      <Link
                        href={routes.studio.logDetail(selectedProjectUuid, fullResult.logUuid)}
                        target="_blank"
                      >
                        View Log →
                      </Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              {testResult ? (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap bg-muted p-3 rounded-md max-h-[300px] overflow-auto">
                      {testResult}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="text-center">
                  <CardContent>Results will appear here.</CardContent>
                </Card>
              )}
            </div>
            {fullResult && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setShowRawOutput(!showRawOutput)}
                  className="flex items-center gap-1 mb-2"
                >
                  {showRawOutput ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="text-sm font-medium">Execution Response</span>
                </Button>
              </div>
            )}
            {fullResult && showRawOutput && (
              <div className="flex-1 flex flex-col overflow-auto border rounded">
                <div className="flex-1 ">
                  <JsonEditor
                    innerClassName="border-none"
                    value={fullResult}
                    onChange={() => {}}
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
