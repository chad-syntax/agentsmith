import { usePromptPage } from '@/providers/prompt-page';
import { JsonEditor } from '../editors/json-editor';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ExternalLink } from 'lucide-react';

type JsonConfigEditorModalProps = {
  isOpen: boolean;
  onOpenChange: () => void;
};

export const JsonConfigEditorModal = (props: JsonConfigEditorModalProps) => {
  const { isOpen, onOpenChange } = props;
  const { state, updateEditorConfig } = usePromptPage();
  const { editorConfig } = state;

  const handleSaveClick = () => {
    updateEditorConfig(editorConfig);
    onOpenChange();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full max-h-full rounded-none sm:rounded-lg sm:max-w-[calc(80%-2rem)] h-full sm:max-h-[calc(80%-2rem)] flex flex-col flex-start overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Config as JSON</DialogTitle>
          <DialogDescription>
            <strong>For advanced usage:</strong> whatever is declared here will be passed along to
            the OpenRouter API.{' '}
            <a
              className="text-xs inline-flex items-center gap-1 underline text-primary"
              href="https://openrouter.ai/docs/api-reference/parameters"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenRouter Reference
              <ExternalLink size={12} />
            </a>
          </DialogDescription>
        </DialogHeader>
        <JsonEditor value={editorConfig} onChange={(value) => updateEditorConfig(value)} />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSaveClick}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
