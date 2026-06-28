'use client';

import Link from 'next/link';
import { useActivityFeed } from '@/hooks/use-activity-feed';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { OrganizerEmptyState } from '@/components/organizer/organizer-empty-state';
import { OrganizerLoadingState } from '@/components/organizer/organizer-loading-state';
import { Activity, Bell } from 'lucide-react';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ActivityFeedPanel({ compact }: { compact?: boolean }) {
  const { items, unreadCount, loading, markRead } = useActivityFeed({ limit: compact ? 8 : 20 });
  const { surface, muted, heading, sectionTitle } = useOrganizerTheme();

  return (
    <section className={`rounded-2xl p-5 h-full flex flex-col ${surface}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-teal-600" />
          <h2 className={`${sectionTitle} ${heading}`}>Activity</h2>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-600 text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && items.length > 0 && (
          <button
            type="button"
            onClick={() => markRead(items.filter(i => !i.readAt).map(i => i.id))}
            className="text-xs font-semibold text-teal-600 hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <OrganizerLoadingState label="Loading activity…" />
      ) : items.length === 0 ? (
        <OrganizerEmptyState
          icon={Bell}
          title="No activity yet"
          description="Vendor applications, booth assignments, and payments will appear here."
        />
      ) : (
        <ul className="space-y-3 flex-1 overflow-y-auto max-h-[480px]">
          {items.map(item => (
            <li
              key={item.id}
              className={`rounded-lg p-3 ${item.readAt ? 'opacity-70' : 'bg-teal-50/50 dark:bg-teal-950/20'}`}
            >
              <div className="flex justify-between gap-2">
                <span className={`text-sm font-medium ${heading}`}>{item.title}</span>
                <span className={`text-[10px] shrink-0 ${muted}`}>{timeAgo(item.createdAt)}</span>
              </div>
              {item.summary && <p className={`text-xs mt-1 ${muted}`}>{item.summary}</p>}
              <span className={`text-[10px] mt-1 inline-block ${muted}`}>{item.eventType}</span>
            </li>
          ))}
        </ul>
      )}

      {!compact && (
        <Link href="/organizer/settings" className="text-xs font-semibold text-teal-600 mt-4 hover:underline">
          Notification settings →
        </Link>
      )}
    </section>
  );
}
