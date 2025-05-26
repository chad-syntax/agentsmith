'use client';

import { GetAlertsResult } from '@/lib/AlertsService';
import { H1, P } from '@/components/typography';
import { format } from 'date-fns';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { Button } from '@/components/ui/button';
import { BookCheck, SquareArrowOutUpRight } from 'lucide-react';
import { useApp } from '@/providers/app';
import { createClient } from '@/lib/supabase/client';
import { AlertsService } from '@/lib/AlertsService';
import { toast } from 'sonner';
import { useState } from 'react';

type AlertsPageProps = {
  alerts: GetAlertsResult;
};

export const AlertsPage = (props: AlertsPageProps) => {
  const { alerts: initialAlerts } = props;

  const { setUnreadAlertsCount } = useApp();

  const [alerts, setAlerts] = useState(initialAlerts);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const handleMarkAsRead = async (alertId: number) => {
    console.log(`Marking alert ${alertId} as read`);
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
        <div className="bg-background rounded-lg shadow-sm p-6 text-center">
          <P className="text-muted-foreground">No alerts found.</P>
        </div>
      ) : (
        <div className="bg-background rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {alerts.map((alert) => {
                const status = alert.read_at ? 'Read' : 'Unread';
                return (
                  <tr key={alert.id} className="hover:bg-muted">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(alert.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground max-w-[300px] truncate">
                      {alert.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {alert.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          alert.read_at
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
