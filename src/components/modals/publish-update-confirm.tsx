'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { usePromptPage } from '@/providers/prompt-page';

export const PublishUpdateConfirmModal = () => {
  const { state, closePublishConfirm, handleSave } = usePromptPage();
  const { isPublishConfirmModalOpen: isOpen, isPublishing } = state;

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && closePublishConfirm()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Published Version</DialogTitle>
          <DialogDescription>
            This action will update the published version of your prompt.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            <strong>Warning:</strong> This will immediately update the published version that may be
            in use by your application. Make sure your code is prepared to handle any changes to
            variables or content to avoid breaking prompt compilation.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closePublishConfirm} disabled={isPublishing}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={() => handleSave('PUBLISHED')}
            disabled={isPublishing}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isPublishing ? 'Updating...' : 'Update Published Version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
