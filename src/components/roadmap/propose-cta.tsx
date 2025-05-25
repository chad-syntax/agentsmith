import { PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth';
import { routes } from '@/utils/routes';
import { cn } from '@/utils/shadcn';

type RoadmapProposeCtaProps = {
  setIsProposeModalOpen: (isOpen: boolean) => void;
  className?: string;
};

export const RoadmapProposeCta = (props: RoadmapProposeCtaProps) => {
  const { setIsProposeModalOpen, className } = props;
  const { isLoading, agentsmithUser } = useAuth();

  const currentUserId = agentsmithUser?.id;

  return isLoading ? (
    <Button disabled className={cn('gap-0', className)}>
      <PlusCircle className="h-4 w-4 mr-2" />
      Propose Feature
    </Button>
  ) : currentUserId ? (
    <Button onClick={() => setIsProposeModalOpen(true)} className={cn('gap-0', className)}>
      <PlusCircle className="h-4 w-4 mr-2" />
      Propose Feature
    </Button>
  ) : (
    <Link href={routes.auth.signIn} passHref legacyBehavior>
      <Button
        asChild
        onClick={() => toast.info('You must be logged in to propose a feature')}
        className={cn('gap-0', className)}
      >
        <div>
          <PlusCircle className="h-4 w-4 mr-2" />
          Propose Feature
        </div>
      </Button>
    </Link>
  );
};
