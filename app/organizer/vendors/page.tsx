'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { OrganizerPageHeader } from '@/components/organizer/organizer-page-header';
import { useOrganizerInbox } from '@/hooks/use-organizer-inbox';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { OrganizerEmptyState } from '@/components/organizer/organizer-empty-state';
import { OrganizerLoadingState } from '@/components/organizer/organizer-loading-state';
import { Users } from 'lucide-react';
import { MatchScoreBadge } from '@/components/organizer/match-score-badge';
import type { OrganizerApplicationInboxItem } from '@/lib/organizer-schema';

export default function OrganizerVendorsPage() {
  const { data, loading } = useOrganizerInbox();
  const { surface, muted, heading, btnPrimary } = useOrganizerTheme();

  const vendors = useMemo(() => {
    const map = new Map<string, OrganizerApplicationInboxItem[]>();
    for (const item of data?.items ?? []) {
      if (item.status !== 'approved') continue;
      const list = map.get(item.vendorEmail) ?? [];
      list.push(item);
      map.set(item.vendorEmail, list);
    }
    return Array.from(map.entries()).map(([email, apps]) => ({
      email,
      name: apps[0].vendorName,
      category: apps[0].category,
      events: apps.length,
      apps,
    }));
  }, [data]);

  return (
    <OrganizerLayout showBanners={false}>
      <OrganizerPageHeader
        title="Vendors"
        description="Approved vendors across your season — booth, payment, and doc status at a glance."
        actions={
          <Link href="/organizer/applications" className={`px-4 py-2 rounded-lg text-sm ${btnPrimary}`}>
            Review applications
          </Link>
        }
      />

      {loading ? (
        <OrganizerLoadingState />
      ) : vendors.length === 0 ? (
        <OrganizerEmptyState
          icon={Users}
          title="No approved vendors yet"
          description="Accept applications from the pipeline to build your vendor roster."
        />
      ) : (
        <div className="space-y-3">
          {vendors.map(v => (
            <div key={v.email} className={`rounded-2xl p-4 ${surface}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className={`font-semibold ${heading}`}>{v.name}</div>
                  <div className={`text-sm ${muted}`}>{v.email} · {v.category}</div>
                  <div className={`text-xs mt-1 ${muted}`}>{v.events} event{v.events !== 1 ? 's' : ''}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {v.apps.map(app => (
                    <MatchScoreBadge key={app.id} vendorEmail={app.vendorEmail} eventId={app.eventId} />
                  ))}
                </div>
              </div>
              <ul className={`mt-3 text-sm space-y-1 ${muted}`}>
                {v.apps.map(app => (
                  <li key={app.id}>
                    {app.eventName}
                    {app.boothId && ` · Booth ${app.boothId}`}
                    {app.paymentStatus !== 'none' && ` · ${app.paymentStatus}`}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </OrganizerLayout>
  );
}
