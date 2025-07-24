import { routes } from '@/utils/routes';
import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowRight, Megaphone } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const StudioGiveFeedback = () => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="fixed bottom-3 right-3">
          <Megaphone className="size-4 rotate-y-180" />
          Feedback
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>We are listening!</AlertDialogTitle>
          <AlertDialogDescription>
            We are always looking for feedback to improve our product. Please share with us your
            thoughts and suggestions by submitting an idea to our roadmap.
            <br />
            <br />
            If your feedback is more suited to a private conversation or not appropriate for the
            public roadmap, please email{' '}
            <a className="underline" href={routes.emails.alex}>
              alex@agentsmith.dev
            </a>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction>
            <Link href={routes.marketing.roadmap(true)} className="flex items-center gap-2">
              Roadmap
              <ArrowRight className="size-4" />
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
