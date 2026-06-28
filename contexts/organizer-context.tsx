'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getActiveOrganizerId, PILOT_ORGANIZER } from '@/lib/pilot-config';

const STORAGE_KEY = 'vendorflow-organizer-season';

interface OrganizerContextValue {
  organizerId: string;
  seriesId: string | null;
  eventId: string | null;
  setSeriesId: (id: string | null) => void;
  setEventId: (id: string | null) => void;
}

const OrganizerContext = createContext<OrganizerContextValue>({
  organizerId: getActiveOrganizerId(),
  seriesId: null,
  eventId: null,
  setSeriesId: () => {},
  setEventId: () => {},
});

export function OrganizerProvider({ children }: { children: React.ReactNode }) {
  const [seriesId, setSeriesIdState] = useState<string | null>(null);
  const [eventId, setEventIdState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { seriesId?: string | null; eventId?: string | null };
        if (parsed.seriesId) setSeriesIdState(parsed.seriesId);
        else setSeriesIdState(PILOT_ORGANIZER.defaultSeriesId);
        if (parsed.eventId) setEventIdState(parsed.eventId);
      } else {
        setSeriesIdState(PILOT_ORGANIZER.defaultSeriesId);
      }
    } catch {
      setSeriesIdState(PILOT_ORGANIZER.defaultSeriesId);
    }
  }, []);

  const setSeriesId = (id: string | null) => {
    setSeriesIdState(id);
    if (id) setEventIdState(null);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ seriesId: id, eventId: null }));
  };

  const setEventId = (id: string | null) => {
    setEventIdState(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ seriesId, eventId: id }));
  };

  return (
    <OrganizerContext.Provider
      value={{
        organizerId: getActiveOrganizerId(),
        seriesId,
        eventId,
        setSeriesId,
        setEventId,
      }}
    >
      {children}
    </OrganizerContext.Provider>
  );
}

export function useOrganizerContext() {
  return useContext(OrganizerContext);
}
