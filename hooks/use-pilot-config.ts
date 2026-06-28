'use client';

import { useEffect, useState } from 'react';
import type { PilotOrganizerProfile } from '@/lib/pilot-config';

interface PilotConfigState {
  enabled: boolean;
  dataSource: 'seed' | 'db';
  organizer: PilotOrganizerProfile;
  loading: boolean;
}

export function usePilotConfig(): PilotConfigState {
  const [state, setState] = useState<PilotConfigState>({
    enabled: true,
    dataSource: 'seed',
    organizer: {
      id: 'org-demo',
      contactName: 'Maria Lopez',
      organization: 'Hempstead Chamber of Commerce',
      email: 'events@hempsteadchamber.org',
      region: 'nassau',
      defaultSeriesId: 'series-li-summer',
      seasonLabel: '2026 Summer Street Fair Series',
      planId: 'org-founders',
      tagline: 'Long Island Founders Edition · Pilot',
    },
    loading: true,
  });

  useEffect(() => {
    fetch('/api/pilot')
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setState({
            enabled: data.enabled,
            dataSource: data.dataSource,
            organizer: data.organizer,
            loading: false,
          });
        } else {
          setState(s => ({ ...s, loading: false }));
        }
      })
      .catch(() => setState(s => ({ ...s, loading: false })));
  }, []);

  return state;
}
