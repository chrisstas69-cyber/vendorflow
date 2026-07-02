'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { FinancialRecord } from '@/lib/mock-data';
import {
  buildDefaultChecklist,
  debriefKey,
  type ChecklistItem,
  type EventDebriefInput,
  type EventDebriefRecord,
} from '@/lib/event-debrief-schema';
import { getPriorYearDebriefs } from '@/lib/event-debrief-export';
import { useVendorEmail } from '@/lib/hooks/use-vendor-email';
import { useIsVendorSurface } from '@/lib/hooks/use-vendor-surface';

const DEBRIEF_STORAGE_KEY = 'vendorflow-debriefs-v1';
const CHECKLIST_TEMPLATE_KEY = 'vendorflow-checklist-template-v1';

interface EventDebriefContextValue {
  ready: boolean;
  saving: boolean;
  debriefs: EventDebriefRecord[];
  checklistTemplate: ChecklistItem[];
  refreshFromServer: () => Promise<void>;
  upsertDebrief: (input: EventDebriefInput) => Promise<EventDebriefRecord>;
  updateChecklist: (debriefId: string, checklist: ChecklistItem[]) => Promise<void>;
  updateChecklistTemplate: (items: ChecklistItem[]) => void;
  addChecklistTemplateItem: (label: string) => void;
  removeChecklistTemplateItem: (id: string) => void;
  getDebriefForEvent: (eventName: string, eventDate: string) => EventDebriefRecord | undefined;
  getOrCreateDebriefDraft: (opts: {
    eventId?: string;
    applicationId?: string;
    eventName: string;
    eventDate: string;
    status: 'booked' | 'completed';
  }) => EventDebriefRecord;
  getPriorYears: (eventName: string, beforeDate: string) => EventDebriefRecord[];
  mergeFinancial: (record: FinancialRecord) => Promise<void>;
  markCompleted: (eventName: string, eventDate: string) => Promise<EventDebriefRecord | undefined>;
}

const EventDebriefContext = createContext<EventDebriefContextValue | null>(null);

function readLocalDebriefs(): EventDebriefRecord[] {
  try {
    const raw = localStorage.getItem(DEBRIEF_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EventDebriefRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalDebriefs(items: EventDebriefRecord[]) {
  try {
    localStorage.setItem(DEBRIEF_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota */
  }
}

function readChecklistTemplate(): ChecklistItem[] {
  try {
    const raw = localStorage.getItem(CHECKLIST_TEMPLATE_KEY);
    if (!raw) return buildDefaultChecklist();
    const parsed = JSON.parse(raw) as ChecklistItem[];
    return Array.isArray(parsed) && parsed.length ? parsed : buildDefaultChecklist();
  } catch {
    return buildDefaultChecklist();
  }
}

function writeChecklistTemplate(items: ChecklistItem[]) {
  try {
    localStorage.setItem(CHECKLIST_TEMPLATE_KEY, JSON.stringify(items));
  } catch {
    /* quota */
  }
}

async function postDebrief(vendorEmail: string, debrief: EventDebriefInput) {
  const res = await fetch('/api/vendors/debriefs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendorEmail, debrief }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? 'Save failed');
  return data.debrief as EventDebriefRecord;
}

export function EventDebriefProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [debriefs, setDebriefs] = useState<EventDebriefRecord[]>([]);
  const [checklistTemplate, setChecklistTemplate] = useState<ChecklistItem[]>(buildDefaultChecklist());
  const { vendorEmail } = useVendorEmail();
  const isVendorSurface = useIsVendorSurface();

  const applyDebriefs = useCallback((items: EventDebriefRecord[]) => {
    setDebriefs(items);
    writeLocalDebriefs(items);
  }, []);

  const refreshFromServer = useCallback(async () => {
    const res = await fetch('/api/vendors/debriefs');
    const data = await res.json();
    if (data.ok && Array.isArray(data.items)) {
      const local = readLocalDebriefs();
      const merged = mergeDebriefLists(data.items as EventDebriefRecord[], local);
      applyDebriefs(merged);
    }
  }, [applyDebriefs, vendorEmail]);

  useEffect(() => {
    if (!isVendorSurface) return;
    setChecklistTemplate(readChecklistTemplate());
    const local = readLocalDebriefs();
    if (local.length) setDebriefs(local);
    refreshFromServer().finally(() => setReady(true));
  }, [refreshFromServer, vendorEmail, isVendorSurface]);

  const upsertDebriefFn = useCallback(
    async (input: EventDebriefInput) => {
      setSaving(true);
      try {
        const saved = await postDebrief(vendorEmail, input);
        setDebriefs(prev => {
          const key = debriefKey(input.eventName, input.eventDate);
          const next = prev.filter(
            d => debriefKey(d.eventName, d.eventDate) !== key
          );
          next.unshift(saved);
          writeLocalDebriefs(next);
          return next;
        });
        return saved;
      } finally {
        setSaving(false);
      }
    },
    [vendorEmail]
  );

  const updateChecklist = useCallback(
    async (debriefId: string, checklist: ChecklistItem[]) => {
      const existing = debriefs.find(d => d.id === debriefId);
      if (!existing) return;
      await upsertDebriefFn({ ...existing, checklist });
    },
    [debriefs, upsertDebriefFn]
  );

  const updateChecklistTemplate = useCallback((items: ChecklistItem[]) => {
    setChecklistTemplate(items);
    writeChecklistTemplate(items);
  }, []);

  const addChecklistTemplateItem = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      updateChecklistTemplate([
        ...checklistTemplate,
        { id: `chk-${Date.now()}`, label: trimmed, done: false },
      ]);
    },
    [checklistTemplate, updateChecklistTemplate]
  );

  const removeChecklistTemplateItem = useCallback(
    (id: string) => {
      updateChecklistTemplate(checklistTemplate.filter(i => i.id !== id));
    },
    [checklistTemplate, updateChecklistTemplate]
  );

  const getDebriefForEvent = useCallback(
    (eventName: string, eventDate: string) => {
      const key = debriefKey(eventName, eventDate);
      return debriefs.find(d => debriefKey(d.eventName, d.eventDate) === key);
    },
    [debriefs]
  );

  const getOrCreateDebriefDraft = useCallback(
    (opts: {
      eventId?: string;
      applicationId?: string;
      eventName: string;
      eventDate: string;
      status: 'booked' | 'completed';
    }): EventDebriefRecord => {
      const existing = getDebriefForEvent(opts.eventName, opts.eventDate);
      if (existing) return existing;
      const now = new Date().toISOString();
      return {
        id: `draft-${opts.eventDate}`,
        vendorEmail,
        eventId: opts.eventId,
        applicationId: opts.applicationId,
        eventName: opts.eventName,
        eventDate: opts.eventDate,
        status: opts.status,
        notes: '',
        issues: '',
        bringNextTime: '',
        missedOpportunities: '',
        topSellers: '',
        checklist: checklistTemplate.map(i => ({ ...i, done: false })),
        createdAt: now,
        updatedAt: now,
      };
    },
    [getDebriefForEvent, checklistTemplate]
  );

  const getPriorYears = useCallback(
    (eventName: string, beforeDate: string) => getPriorYearDebriefs(debriefs, eventName, beforeDate),
    [debriefs]
  );

  const mergeFinancial = useCallback(
    async (record: FinancialRecord) => {
      const existing = getDebriefForEvent(record.eventName, record.date);
      const base =
        existing ??
        getOrCreateDebriefDraft({
          eventId: record.eventId,
          eventName: record.eventName,
          eventDate: record.date,
          status: 'completed',
        });
      await upsertDebriefFn({
        ...base,
        status: 'completed',
        financialId: record.id,
        grossSales: record.grossSales,
        expenses: record.expenses,
        netProfit: record.netProfit,
        margin: record.margin,
        breakEvenHour: record.breakEvenHour,
        bestHour: record.bestHour,
        cashPercent: record.cashPercent,
        cardPercent: record.cardPercent,
      });
    },
    [getDebriefForEvent, getOrCreateDebriefDraft, upsertDebriefFn]
  );

  const markCompleted = useCallback(
    async (eventName: string, eventDate: string) => {
      const existing = getDebriefForEvent(eventName, eventDate);
      if (!existing) return undefined;
      return upsertDebriefFn({ ...existing, status: 'completed' });
    },
    [getDebriefForEvent, upsertDebriefFn]
  );

  const value = useMemo(
    () => ({
      ready,
      saving,
      debriefs,
      checklistTemplate,
      refreshFromServer,
      upsertDebrief: upsertDebriefFn,
      updateChecklist,
      updateChecklistTemplate,
      addChecklistTemplateItem,
      removeChecklistTemplateItem,
      getDebriefForEvent,
      getOrCreateDebriefDraft,
      getPriorYears,
      mergeFinancial,
      markCompleted,
    }),
    [
      ready,
      saving,
      debriefs,
      checklistTemplate,
      refreshFromServer,
      upsertDebriefFn,
      updateChecklist,
      updateChecklistTemplate,
      addChecklistTemplateItem,
      removeChecklistTemplateItem,
      getDebriefForEvent,
      getOrCreateDebriefDraft,
      getPriorYears,
      mergeFinancial,
      markCompleted,
    ]
  );

  return (
    <EventDebriefContext.Provider value={value}>{children}</EventDebriefContext.Provider>
  );
}

function mergeDebriefLists(
  server: EventDebriefRecord[],
  local: EventDebriefRecord[]
): EventDebriefRecord[] {
  const map = new Map<string, EventDebriefRecord>();
  for (const item of server) {
    map.set(debriefKey(item.eventName, item.eventDate), item);
  }
  for (const item of local) {
    const key = debriefKey(item.eventName, item.eventDate);
    const existing = map.get(key);
    if (!existing || item.updatedAt > existing.updatedAt) {
      map.set(key, item);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}

export function useEventDebrief() {
  const ctx = useContext(EventDebriefContext);
  if (!ctx) throw new Error('useEventDebrief must be used within EventDebriefProvider');
  return ctx;
}
