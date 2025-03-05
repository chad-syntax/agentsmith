'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { routes } from '@/utils/routes';
import { GetOrganizationDataResult } from '@/lib/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { H1 } from '@/components/typography';

type OrganizationEditPageProps = {
  organizationData: GetOrganizationDataResult;
};

export const OrganizationEditPage = (props: OrganizationEditPageProps) => {
  const { organizationData } = props;
  const router = useRouter();

  const [name, setName] = useState(organizationData.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSave = async () => {
    if (!organizationData.uuid) return;
    if (!name.trim()) {
      setError('Organization name cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Call the rename_organization RPC function
      const { error: rpcError } = await supabase.rpc('rename_organization', {
        arg_organization_uuid: organizationData.uuid,
        arg_name: name,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      // Navigate back to organization page
      router.push(routes.studio.organization(organizationData.uuid));
    } catch (e) {
      setError(
        typeof e === 'object' && e !== null && 'message' in e
          ? (e.message as string)
          : 'An error occurred while saving'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <H1 className="mb-8">Edit Organization</H1>

      <div className="max-w-lg">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="mb-6">
          <Label htmlFor="orgName">Organization Name</Label>
          <Input
            id="orgName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter organization name"
          />
        </div>

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>

          <Button variant="outline" asChild>
            <Link href={routes.studio.organization(organizationData.uuid)}>
              Cancel
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
