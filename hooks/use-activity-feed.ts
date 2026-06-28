'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ActivityFeedDTO } from '@/lib/workflow/event-types';
import { getActiveOrganizerId } from '@/lib/pilot-config';

export function useActivityFeed(options?: { limit?: number; unreadOnly?: boolean }) {
  const [items, setItems] = useState<ActivityFeedDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'seed' | 'db'>('seed');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ organizerId: getActiveOrganizerId() });
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.unreadOnly) params.set('unreadOnly', '1');
      const res = await fetch(`/api/organizer/activity?${params}`);
      const json = await res.json();
      if (json.ok) {
        setItems(json.items ?? []);
        setUnreadCount(json.unreadCount ?? 0);
        setDataSource(json.dataSource ?? 'seed');
      }
    } finally {
      setLoading(false);
    }
  }, [options?.limit, options?.unreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(
    async (ids: string[]) => {
      await fetch('/api/organizer/activity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      await load();
    },
    [load]
  );

  return { items, unreadCount, loading, dataSource, reload: load, markRead };
}
