'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { routes } from '@/utils/routes';
import { createProject } from '@/app/actions/project';

type CreateProjectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationUuid: string;
};

export function CreateProjectModal({
  open,
  onOpenChange,
  organizationUuid,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const result = await createProject(organizationUuid, projectName);
      if (result.success) {
        onOpenChange(false);
        setProjectName('');
        router.push(routes.studio.project(result.data));
      } else if (!result.success && result.message && !result.errors) {
        setErrors({
          'create-project': [result.message],
        });
      } else if (result.errors) {
        setErrors(result.errors);
      }
    } catch (err: any) {
      setErrors({
        'create-project': [err?.message || 'Failed to create project'],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <DialogDescription>Create a new project in this organization.</DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="project-name" className="mb-2">
              Project Name
            </Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Project"
              required
              disabled={loading}
              autoFocus
            />
          </div>
          {errors && (
            <div className="text-destructive text-sm">
              {Object.entries(errors).map(([key, value]) => (
                <div key={key}>{value}</div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !projectName}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
