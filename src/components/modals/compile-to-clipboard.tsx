'use client';

import { useState, useEffect } from 'react';
// @ts-ignore - nunjucks doesn't export these types properly
// import nunjucks from 'nunjucks/browser/nunjucks'; // No longer directly needed here
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { validateVariables, validateGlobalContext, compilePrompt } from '@/utils/template-utils'; // Import new utils
import { toast } from 'sonner';
import { EditorPromptVariable } from '@/types/prompt-editor';

type CompileToClipboardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  variables: EditorPromptVariable[];
  promptContent: string;
  globalContext: Record<string, any>; // Added globalContext prop
};

export const CompileToClipboardModal = (props: CompileToClipboardModalProps) => {
  const { isOpen, onClose, variables, promptContent, globalContext } = props; // Destructure globalContext

  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (variableName: string, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [variableName]: value,
    }));
    setError(null); // Clear error on input change
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);

    // 1. Validate standard variables
    const { missingRequiredVariables, variablesWithDefaults } = validateVariables(
      variables,
      inputValues,
    );

    let currentErrors: string[] = [];

    if (missingRequiredVariables.length > 0) {
      currentErrors = missingRequiredVariables.map((v) => `Variable '${v.name}' is required.`);
    }

    // 2. Validate global context
    try {
      const { missingGlobalContext } = validateGlobalContext(promptContent, globalContext);
      if (missingGlobalContext.length > 0) {
        currentErrors.push(`Missing global context variables: ${missingGlobalContext.join(', ')}`);
      }
    } catch (validationError: any) {
      // This can happen if template parsing itself fails within validateGlobalContext
      currentErrors.push(`Template validation error: ${validationError.message}`);
    }

    if (currentErrors.length > 0) {
      setError(currentErrors.join('\n'));
      setIsProcessing(false);
      return;
    }

    try {
      // 3. Compile the prompt
      const finalVariablesForCompilation = {
        ...variablesWithDefaults,
        global: globalContext,
      };

      const compiledContent = compilePrompt(promptContent, finalVariablesForCompilation);

      await navigator.clipboard.writeText(compiledContent);
      toast.success('Compiled prompt copied to clipboard!');
      onClose(); // Close modal on success
    } catch (compileError: any) {
      console.error('Error compiling prompt or copying to clipboard:', compileError);
      setError(
        compileError.message || 'Failed to compile prompt or copy to clipboard. Check console.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Effect to reset state when modal is opened/closed or variables change
  useEffect(() => {
    setInputValues({});
    setError(null);
    setIsProcessing(false);
  }, [isOpen, variables]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Compile to Clipboard</DialogTitle>
          <DialogDescription>
            Enter the required variables below. The compiled output will be copied to your
            clipboard.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              {variables.map((variable) => (
                <div key={variable.id || variable.name} className="space-y-2">
                  <Label htmlFor={variable.name}>
                    {variable.name}
                    {variable.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <div className="mx-1">
                    <Input
                      id={variable.name}
                      type={variable.type === 'NUMBER' ? 'number' : 'text'}
                      value={inputValues[variable.name] || ''}
                      placeholder={
                        variable.default_value ? `Default: ${variable.default_value}` : ''
                      }
                      onChange={(e) => handleInputChange(variable.name, e.target.value)}
                    />
                  </div>
                </div>
              ))}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleSubmit} disabled={isProcessing} className="w-full">
                {isProcessing ? 'Processing...' : 'Compile & Copy'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
