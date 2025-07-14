'use client';

import { GetAlertsResult } from '@/lib/AlertsService';
import { H1, P } from '@/components/typography';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { Button } from '@/components/ui/button';
import { BookCheck, SquareArrowOutUpRight } from 'lucide-react';
import { useApp } from '@/providers/app';
import { createClient } from '@/lib/supabase/client';
import { AlertsService } from '@/lib/AlertsService';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { DisplayTime } from '@/components/display-time';

type AlertsPageProps = {
  alerts: GetAlertsResult;
};

export const AlertsPage = (props: AlertsPageProps) => {
  const { alerts: initialAlerts } = props;

  const { setUnreadAlertsCount } = useApp();

  const [alerts, setAlerts] = useState(initialAlerts);

  const handleMarkAsRead = async (alertId: number) => {
    const supabase = createClient();

    const alertsService = new AlertsService({ supabase });

    try {
      await alertsService.readAlert(alertId);
      setUnreadAlertsCount((prev) => prev - 1);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, read_at: new Date().toISOString() } : alert,
        ),
      );
      toast.success('Alert marked as read');
    } catch (error) {
      console.error(error);
      toast.error('Failed to mark alert as read');
    }
  };

  return (
    <div className="p-6">
      <H1 className="mb-4">User Alerts</H1>

      {alerts.length === 0 ? (
        <div className="bg-background p-6 text-center">
          <P className="text-muted-foreground">No alerts found.</P>
        </div>
      ) : (
        <div className="bg-background overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => {
                const status = alert.read_at ? 'Read' : 'Unread';
                return (
                  <TableRow key={alert.id} className="hover:bg-muted">
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <DisplayTime dateTime={alert.created_at} formatString="MMM d, yyyy h:mm a" />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-foreground whitespace-normal">
                      <div className="min-w-sm max-w-md break-words">{alert.title}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {alert.type}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          alert.read_at
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!alert.read_at && (
                        <Button
                          variant="link"
                          onClick={() => handleMarkAsRead(alert.id)}
                          aria-label="Mark as read"
                        >
                          <BookCheck />
                        </Button>
                      )}
                      {alert.roadmap_items?.slug && (
                        <Button variant="link" asChild aria-label="View roadmap item">
                          <Link href={routes.marketing.roadmapItem(alert.roadmap_items.slug)}>
                            <SquareArrowOutUpRight />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export const AlertsPageSkeleton = () => (
  <div className="p-6">
    <H1 className="mb-4">User Alerts</H1>

    <div className="bg-background overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Date
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Title
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Type
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map((i) => (
            <TableRow key={i} className="hover:bg-muted">
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                <div className="bg-muted rounded w-24 h-4 animate-pulse">&nbsp;</div>
              </TableCell>
              <TableCell className="px-6 py-4 text-sm text-foreground whitespace-normal">
                <div className="min-w-sm max-w-md">
                  <div className="bg-muted rounded w-48 h-4 animate-pulse mb-1">&nbsp;</div>
                  <div className="bg-muted rounded w-32 h-3 animate-pulse">&nbsp;</div>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                <div className="bg-muted rounded w-16 h-4 animate-pulse">&nbsp;</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="bg-muted rounded w-12 h-5 animate-pulse">&nbsp;</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex gap-2">
                  <div className="bg-muted rounded w-8 h-8 animate-pulse">&nbsp;</div>
                  <div className="bg-muted rounded w-8 h-8 animate-pulse">&nbsp;</div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
