'use client';

import { useEffect } from 'react';
import { usePromptPage } from '@/providers/prompt-page';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Save,
  Send,
  RefreshCw,
  FileEdit,
  Play,
  ClipboardCopy,
  ChevronDown,
  GitBranchPlus,
  CornerDownLeft,
} from 'lucide-react';
import { AltKeyIcon, MetaKeyIcon } from '../mod-key-labels';

export const EditorActions = () => {
  const {
    state,
    handleSave,
    openCreateVersionModal,
    openTestModal,
    openCompileToClipboardModal,
    openPublishConfirm,
  } = usePromptPage();

  const { currentVersion, isSaving, isPublishing, isCreatingVersion, hasChanges } = state;

  const isDraft = currentVersion.status === 'DRAFT';
  const isPublished = currentVersion.status === 'PUBLISHED';

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + Enter => Open Test modal
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        openTestModal();
        return;
      }

      // Cmd/Ctrl + S => Save (Draft) or Update (Published)
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (isDraft) {
          if (!isSaving && hasChanges) {
            handleSave('DRAFT');
          }
        } else if (isPublished) {
          if (!isSaving && hasChanges) {
            openPublishConfirm();
          }
        }
        return;
      }

      // Option/Alt + C => Compile to Clipboard
      if (
        (event.altKey && !event.metaKey && !event.ctrlKey && event.key.toLowerCase() === 'c') ||
        event.key.toLowerCase() === 'ç'
      ) {
        event.preventDefault();
        openCompileToClipboardModal();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [
    openTestModal,
    handleSave,
    openCompileToClipboardModal,
    openPublishConfirm,
    isDraft,
    isPublished,
    isSaving,
    hasChanges,
  ]);

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" disabled={isSaving} onClick={openTestModal}>
        <Play size={16} />
        Test
        <div className="flex items-center gap-0.5">
          <MetaKeyIcon className="size-3" />
          <CornerDownLeft className="size-3" />
        </div>
      </Button>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More actions">
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer hover:[&>svg]:text-background"
              onClick={openCreateVersionModal}
              disabled={isCreatingVersion || isSaving}
            >
              <GitBranchPlus size={16} />
              {isCreatingVersion ? 'Creating…' : 'New Version'}
            </DropdownMenuItem>

            {isDraft && (
              <DropdownMenuItem
                className="cursor-pointer hover:[&>svg]:text-background hover:text-background"
                onClick={() => handleSave('DRAFT')}
                disabled={isSaving || !hasChanges}
              >
                <Save size={16} />
                {isSaving ? 'Saving…' : 'Save'}
                <DropdownMenuShortcut className="text-md flex items-center gap-0.5">
                  <MetaKeyIcon className="size-3" />S
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            )}

            {isDraft && (
              <DropdownMenuItem
                className="cursor-pointer hover:[&>svg]:text-background"
                onClick={() => handleSave('PUBLISHED')}
                disabled={isSaving || isPublishing}
              >
                <Send size={16} />
                {isSaving ? 'Publishing…' : 'Publish'}
              </DropdownMenuItem>
            )}

            {isPublished && (
              <DropdownMenuItem
                className="cursor-pointer hover:[&>svg]:text-background"
                onClick={() => openPublishConfirm()}
                disabled={isSaving || !hasChanges}
              >
                <RefreshCw size={16} />
                {isSaving ? 'Updating…' : 'Update'}
              </DropdownMenuItem>
            )}

            {isPublished && (
              <DropdownMenuItem
                className="cursor-pointer hover:[&>svg]:text-background"
                onClick={() => handleSave('DRAFT')}
                disabled={isSaving || isPublishing}
              >
                <FileEdit size={16} />
                {isPublishing ? 'Setting to Draft…' : 'Set to Draft'}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer hover:[&>svg]:text-background hover:text-background group"
              onClick={openCompileToClipboardModal}
            >
              <ClipboardCopy size={16} />
              Compile to Clipboard
              <DropdownMenuShortcut className="text-md group-hover:text-background flex items-center gap-0.5">
                <AltKeyIcon className="size-3 group-hover:text-background" />C
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
