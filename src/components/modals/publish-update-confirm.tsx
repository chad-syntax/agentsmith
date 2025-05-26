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

type PublishUpdateConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isUpdating: boolean;
};

export const PublishUpdateConfirmModal = (props: PublishUpdateConfirmModalProps) => {
  const { isOpen, onClose, onConfirm, isUpdating } = props;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            disabled={isUpdating}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isUpdating ? 'Updating...' : 'Update Published Version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
