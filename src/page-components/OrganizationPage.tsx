'use client';

import { useState } from 'react';
import { Clipboard, LinkIcon, Pencil } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { Button } from '@/components/ui/button';
import { H1, H2, P } from '@/components/typography';
import { GetOrganizationDataResult } from '@/lib/OrganizationsService';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Grid } from '@/components/layout/grid';

type OrganizationPageProps = {
  organization: NonNullable<GetOrganizationDataResult>;
};

export const OrganizationPage = (props: OrganizationPageProps) => {
  const { organization } = props;

  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(organization.invite_code);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.origin}/join/${organization.invite_code}`;
    navigator.clipboard.writeText(inviteLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  return (
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">Invite Code:</span>
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
        <Grid cols={3} gap={6} className="w-full">
          {organization.projects.map((project) => (
            <Link
              key={project.id}
              href={routes.studio.project(project.uuid)}
              className="block h-full group focus:outline-none focus:ring-2 focus:ring-primary rounded-xl"
            >
              <Card className="h-full transition-shadow group-hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {project.name}
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
