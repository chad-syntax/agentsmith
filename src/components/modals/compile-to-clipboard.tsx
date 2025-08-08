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
import { toast } from 'sonner';
import { VariableInput } from '../prompt-editor/variable-input';
import { usePromptPage } from '@/providers/prompt-page';

export const CompileToClipboardModal = () => {
  const { state, closeCompileToClipboardModal, setInputVariables } = usePromptPage();
  const {
    editorVariables,
    isCompileToClipboardModalOpen: isOpen,
    missingGlobals,
    missingRequiredVariables,
    mergedIncludedVariables,
    notExistingIncludes,
    inputVariables,
    compiledPrompt,
    compiledMessages,
    currentVersion,
  } = state;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasClickedCompileOnce, setHasClickedCompileOnce] = useState(false);

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);
    setHasClickedCompileOnce(true);

    if (missingRequiredVariables.length > 0) {
      setIsProcessing(false);
      return;
    }

    try {
      const targetContent =
        currentVersion.type === 'CHAT' ? JSON.stringify(compiledMessages, null, 2) : compiledPrompt;
      await navigator.clipboard.writeText(targetContent);
      toast.success('Compiled prompt copied to clipboard!');
      closeCompileToClipboardModal(); // Close modal on success
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
    setError(null);
    setIsProcessing(false);
    setHasClickedCompileOnce(false);
  }, [isOpen, editorVariables]);

  const handleVariableChange = (variableName: string, value: any) => {
    setInputVariables({
      ...inputVariables,
      [variableName]: value,
    });
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && closeCompileToClipboardModal()}>
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
              {mergedIncludedVariables.map((variable) => (
                <div key={variable.id || variable.name} className="space-y-2">
                  <Label htmlFor={variable.name}>
                    {variable.name}
                    {variable.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <div className="mx-1">
                    <VariableInput
                      variable={variable}
                      value={inputVariables[variable.name]}
                      onChange={(value) => handleVariableChange(variable.name, value)}
                    />
                  </div>
                </div>
              ))}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {missingRequiredVariables.length > 0 && hasClickedCompileOnce && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Missing required variables:{' '}
                    {missingRequiredVariables.map((v) => v.name).join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {missingGlobals.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Missing global context variables: {missingGlobals.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {notExistingIncludes.size > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Not existing includes: {Array.from(notExistingIncludes).join(', ')}
                  </AlertDescription>
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
