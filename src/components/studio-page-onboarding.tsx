'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, HousePlus } from 'lucide-react';
import { H3, P } from './typography';
import { useState } from 'react';
import { CreateOrganizationModal } from './modals/create-organization';
import { JoinOrganizationModal } from './modals/join-organization';

const onboardingQuestions = [
  // Step 1: Role & Intent
  {
    step: 1,
    questions: [
      {
        question: 'What best describes your role?',
        options: [
          'Engineer / Developer',
          'Product Manager',
          'Founder / Executive',
          'Prompt Engineer',
          'Copywriter',
          'Other',
        ],
      },
    ],
  },
  // Step 2: Are you joining an existing Agentsmith Organization?
  {
    step: 2,
    questions: [
      {
        question: 'Are you joining an existing Agentsmith Organization?',
        options: [
          { label: 'Yes', action: 'openJoinModal' },
          { label: 'No', action: 'continue' },
        ],
      },
    ],
  },
  // Step 3: Company & Team Info
  {
    step: 3,
    questions: [
      {
        question: 'What’s your company’s name?',
        type: 'text',
      },
      {
        question: 'How big is your team?',
        options: ['Just me', '2–10', '11–50', '51–200', '200+'],
      },
    ],
  },
  // Step 4: What do you hope to get out of Agentsmith?
  {
    step: 4,
    questions: [
      {
        question: 'What do you hope to get out of Agentsmith?',
        options: [
          'Keep prompts organized',
          'Keep prompts between devs and non-devs in sync',
          'Test and evaluate prompts',
          'Monitor prompt performance',
          'Just checking it out',
        ],
      },
    ],
  },
  // then open the create organization modal with the org name pre-filled
];

export const StudioPageOnboarding = () => {
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
