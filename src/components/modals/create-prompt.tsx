'use client';

import { useState } from 'react';
import { createPromptWithDraftVersion } from '@/app/actions/prompts';
import { useRouter } from 'next/navigation';
import { routes } from '@/utils/routes';
import { useApp } from '@/providers/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Database } from '@/app/__generated__/supabase.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

type PromptType = Database['public']['Enums']['prompt_type'];

type CreatePromptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
};

export const CreatePromptModal = (props: CreatePromptModalProps) => {
  const { isOpen, onClose, projectId } = props;
  const [name, setName] = useState('');
  const [type, setType] = useState<PromptType>('CHAT');
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();
  const { selectedProjectUuid, onboardingChecklist, setOnboardingChecklist } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please provide a name for the prompt');
      return;
    }

    setIsCreating(true);

    try {
      const response = await createPromptWithDraftVersion({
        name,
        projectId,
        type,
      });

      if (response.success && response.data) {
        // Redirect to the edit page for the new draft version
        router.push(
          routes.studio.editPromptVersion(selectedProjectUuid, response.data.versionUuid),
        );
      } else {
        setIsCreating(false);
        if (response.message) {
          setErrors({
            'create-prompt': [response.message],
          });
        } else if (response.errors) {
          setErrors(response.errors);
        }
      }
    } catch (error) {
      setErrors({
        'create-prompt': ['Failed to create prompt. Please try again.'],
      });
    } finally {
      if (!onboardingChecklist?.promptCreated) {
        setOnboardingChecklist((prev) => (!prev ? null : { ...prev, promptCreated: true }));
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Prompt</DialogTitle>
          <DialogDescription>
            Enter a name for your new prompt. You can edit its content and type after creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Prompt Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter prompt name"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Prompt Type</Label>
              <Tabs defaultValue="chat" onValueChange={(value) => setType(value as PromptType)}>
                <TabsList className="rounded-md">
                  <TabsTrigger className="cursor-pointer rounded-md" value="CHAT">
                    Chat
                  </TabsTrigger>
                  <TabsTrigger className="cursor-pointer rounded-md" value="NON_CHAT">
                    Non-Chat
                  </TabsTrigger>
                </TabsList>
                <TabsContent className="text-sm min-h-[40px]" value="CHAT">
                  Chat prompts include a system message with alternating user and assistant
                  messages.
                </TabsContent>
                <TabsContent className="text-sm min-h-[40px]" value="NON_CHAT">
                  Non-chat prompts are a single message of instructions.
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Continue'}
            </Button>
          </DialogFooter>
        </form>
        {errors && (
          <div className="text-destructive text-sm">
            {Object.entries(errors).map(([key, value]) => (
              <div key={key}>{value}</div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
