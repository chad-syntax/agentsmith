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
import { createOrganization } from '@/app/actions/organization';
import { useRouter } from 'next/navigation';
import { routes } from '@/utils/routes';

type CreateOrganizationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateOrganizationModal({ open, onOpenChange }: CreateOrganizationModalProps) {
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const result = await createOrganization(orgName);
      if (result.success) {
        onOpenChange(false);
        setOrgName('');
        if (!result.data) {
          setErrors({
            'create-organization': ['No new organization data returned, please try again'],
          });
        } else {
          router.push(routes.studio.project(result.data.project_uuid));
        }
      } else if (result.errors) {
        setErrors(result.errors);
      }
    } catch (err: any) {
      setErrors({
        'create-organization': [err?.message || 'Failed to create organization'],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>
        <DialogDescription>Create an organization to get started.</DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="org-name" className="mb-2">
              Organization Name
            </Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Inc."
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
            <Button type="submit" disabled={loading || !orgName}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
