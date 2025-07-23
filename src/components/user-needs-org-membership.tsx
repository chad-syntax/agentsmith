'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, HousePlus } from 'lucide-react';
import { H3, P } from './typography';
import { useState } from 'react';
import { CreateOrganizationModal } from './modals/create-organization';
import { JoinOrganizationModal } from './modals/join-organization';

export const UserNeedsOrgMembership = () => {
  const [createOrganizationModalOpen, setCreateOrganizationModalOpen] = useState(false);
  const [joinOrganizationModalOpen, setJoinOrganizationModalOpen] = useState(false);
  const handleCreateOrganizationClick = () => {
    setCreateOrganizationModalOpen(true);
  };

  const handleJoinOrganizationClick = () => {
    setJoinOrganizationModalOpen(true);
  };

  return (
    <>
      <CreateOrganizationModal
        open={createOrganizationModalOpen}
        onOpenChange={setCreateOrganizationModalOpen}
      />
      <JoinOrganizationModal
        open={joinOrganizationModalOpen}
        onOpenChange={setJoinOrganizationModalOpen}
      />

      <div>
        <H3>You don't have any organizations yet.</H3>
        <P>To get started, you need to create an organization or join an organization.</P>
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <Card
            className="transition-shadow hover:shadow-lg group cursor-pointer md:max-w-96"
            onClick={handleCreateOrganizationClick}
            tabIndex={0}
            role="button"
            aria-label="Create Organization"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleCreateOrganizationClick();
            }}
          >
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <HousePlus />
                Create Organization
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className="transition-shadow hover:shadow-lg group cursor-pointer md:max-w-96"
            onClick={handleJoinOrganizationClick}
            tabIndex={0}
            role="button"
            aria-label="Join Organization"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleJoinOrganizationClick();
            }}
          >
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Handshake />
                Join Organization
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </>
  );
};
