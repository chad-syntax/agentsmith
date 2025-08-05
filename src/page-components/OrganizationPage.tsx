'use client';

import { useState, useTransition } from 'react';
import { Clipboard, LinkIcon, Pencil, X } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { Button } from '@/components/ui/button';
import { H1, H2 } from '@/components/typography';
import { GetOrganizationDataResult } from '@/lib/OrganizationsService';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid } from '@/components/layout/grid';
import { CreateProjectModal } from '@/components/modals/create-project';
import { useApp } from '@/providers/app';
import { ConfirmRemoveUserModal } from '@/components/modals/confirm-remove-user';
import { removeOrganizationUser } from '@/app/actions/organization';
import { useAuth } from '@/providers/auth';
import { toast } from 'sonner';
import { cn } from '@/utils/shadcn';
import { UpgradeOrganizationModal } from '@/components/modals/upgrade-organization';

type OrganizationUser = NonNullable<GetOrganizationDataResult>['organization_users'][number];

type OrganizationPageProps = {
  organization: NonNullable<GetOrganizationDataResult>;
};

export const OrganizationPage = (props: OrganizationPageProps) => {
  const { organization } = props;

  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<OrganizationUser | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { isOrganizationAdmin, selectedOrganization } = useApp();
  const { agentsmithUser } = useAuth();
  const [isPending, startTransition] = useTransition();

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(organization.invite_code);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    const inviteLink = `${window.origin}/join/${organization.invite_code}`;
    await navigator.clipboard.writeText(inviteLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  const handleRemoveUser = () => {
    if (!userToRemove) return;
    startTransition(async () => {
      const response = await removeOrganizationUser(userToRemove.id, organization.uuid);
      if (!response.success) {
        toast.error(response.message || 'Failed to remove user.');
      }
      if (response.success) {
        toast.success(response.message || 'User removed successfully.');
      }
      setUserToRemove(null);
    });
  };

  const isFreeTier = selectedOrganization?.agentsmith_tiers.tier === 'FREE';

  return (
    <>
      <CreateProjectModal
        open={createProjectModalOpen}
        onOpenChange={setCreateProjectModalOpen}
        organizationUuid={organization.uuid}
      />
      <UpgradeOrganizationModal
        organizationUuid={organization.uuid}
        open={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
      />
      {userToRemove && (
        <ConfirmRemoveUserModal
          open={!!userToRemove}
          onOpenChange={() => setUserToRemove(null)}
          onConfirm={handleRemoveUser}
          userEmail={userToRemove.agentsmith_users.email || ''}
          isPending={isPending}
        />
      )}
      <div className="flex-1 w-full flex flex-col gap-12 p-4">
        <div className="flex items-center gap-2">
          <H1>{organization.name}</H1>
          <Button variant="ghost" size="icon" asChild>
            <Link href={routes.studio.editOrganization(organization.uuid)}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        {/* Invite section - compact UI */}
        <div>
          <div>
            <Link href={routes.studio.organizationBilling(organization.uuid)}>
              <Button variant="link" className="p-0" size="sm">
                Billing
              </Button>
            </Link>
          </div>
          <span className="font-medium mr-1">Invite Code:</span>
          <span className="px-2 py-1 rounded bg-muted text-sm font-mono select-all">
            {organization.invite_code}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyCode}
            className={isCodeCopied ? 'text-green-500' : 'text-blue-500'}
            aria-label="Copy invite code"
          >
            <Clipboard className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyLink}
            className={isLinkCopied ? 'text-green-500' : 'text-blue-500'}
            aria-label="Copy invite link"
          >
            <span className="sr-only">Copy Invite Link</span>
            <LinkIcon className="h-4 w-4" />
          </Button>
          {isLinkCopied && <span className="text-green-600 text-xs ml-2">Invite Link Copied!</span>}
          {isCodeCopied && !isLinkCopied && (
            <span className="text-green-600 text-xs ml-2">Invite Code Copied!</span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <H2>Projects</H2>
          <div className="w-full flex flex-wrap gap-6 flex-col sm:flex-row">
            {organization.projects.map((project) => (
              <Link
                key={project.id}
                href={routes.studio.project(project.uuid)}
                className="block h-full group focus:outline-none focus:ring-2 focus:ring-primary rounded-xl"
              >
                <Card className="h-full transition-shadow group-hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="group-hover:text-primary transition-colors text-center">
                      {project.name}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
            {isOrganizationAdmin && (
              <button
                type="button"
                onClick={
                  isFreeTier
                    ? () => {
                        setIsUpgradeModalOpen(true);
                        toast.info(
                          'You need to upgrade your organization to create more than one project.',
                        );
                      }
                    : () => setCreateProjectModalOpen(true)
                }
                className={cn(
                  'block cursor-pointer h-full group focus:outline-none focus:ring-2 focus:ring-primary rounded-xl',
                  isFreeTier && 'focus:ring-muted-foreground/30',
                )}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                }}
              >
                <Card
                  className={cn(
                    'h-full flex flex-col items-center justify-center gap-2 border-dashed border-2 border-primary/80 hover:shadow-lg transition-all',
                    isFreeTier && 'border-muted-foreground/30',
                  )}
                >
                  <CardHeader>
                    <CardTitle
                      className={cn('text-primary', isFreeTier && 'text-muted-foreground/30')}
                    >
                      Create New Project
                    </CardTitle>
                  </CardHeader>
                </Card>
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <H2>Organization Users</H2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Created At</TableHead>
                {isOrganizationAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {organization.organization_users.length > 0 ? (
                organization.organization_users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.agentsmith_users.email}</TableCell>
                    <TableCell>{user.agentsmith_users.auth_user_id}</TableCell>
                    <TableCell>
                      {user.agentsmith_users.created_at ? (
                        <time
                          dateTime={new Date(user.agentsmith_users.created_at).toISOString()}
                          suppressHydrationWarning
                        >
                          {new Date(user.agentsmith_users.created_at).toLocaleString()}
                        </time>
                      ) : (
                        ''
                      )}
                    </TableCell>
                    {isOrganizationAdmin && agentsmithUser?.id !== user.agentsmith_users.id && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setUserToRemove(user)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground italic">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export const OrganizationPageSkeleton = () => (
  <div className="flex-1 w-full flex flex-col gap-12 p-4">
    <div className="flex items-center gap-2">
      <div className="bg-muted rounded w-64 h-12 animate-pulse">&nbsp;</div>
      <Button variant="ghost" size="icon" disabled>
        <Pencil className="h-4 w-4" />
      </Button>
    </div>

    {/* Invite section skeleton */}
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium">Invite Code:</span>
      <div className="px-2 py-1 rounded bg-muted text-sm font-mono w-24 h-6 animate-pulse">
        &nbsp;
      </div>
      <Button variant="ghost" size="icon" disabled>
        <Clipboard className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" disabled>
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>

    <div className="flex flex-col gap-4">
      <H2>Projects</H2>
      <Grid cols={3} gap={6} className="w-full">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-full">
            <CardHeader>
              <div className="bg-muted rounded w-32 h-4 animate-pulse">&nbsp;</div>
            </CardHeader>
          </Card>
        ))}
      </Grid>
    </div>

    <div className="flex flex-col gap-4">
      <H2>Organization Users</H2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="bg-muted rounded w-16 h-4 animate-pulse">&nbsp;</div>
              </TableCell>
              <TableCell>
                <div className="bg-muted rounded w-32 h-4 animate-pulse">&nbsp;</div>
              </TableCell>
              <TableCell>
                <div className="bg-muted rounded w-24 h-4 animate-pulse">&nbsp;</div>
              </TableCell>
              <TableCell>
                <div className="bg-muted rounded w-28 h-4 animate-pulse">&nbsp;</div>
              </TableCell>
              <TableCell>
                <div className="bg-muted rounded w-8 h-8 animate-pulse">&nbsp;</div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
