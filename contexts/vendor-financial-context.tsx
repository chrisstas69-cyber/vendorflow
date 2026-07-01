'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { FinancialRecord } from '@/lib/mock-data';
import { useVendorEmail } from '@/lib/hooks/use-vendor-email';
import {
  financialFromRecord,
  recordFromFinancial,
  type VendorFinancialRecord,
} from '@/lib/vendor-financial-schema';

const STORAGE_KEY = 'vendorflow-financials-v1';

interface VendorFinancialContextValue {
  ready: boolean;
  financials: FinancialRecord[];
  refresh: () => Promise<void>;
  upsertFinancial: (record: Omit<FinancialRecord, 'id'>, source?: 'import' | 'quick-log') => Promise<FinancialRecord>;
}

const VendorFinancialContext = createContext<VendorFinancialContextValue | null>(null);

function readLocal(): VendorFinancialRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VendorFinancialRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: VendorFinancialRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota */
  }
}

export function VendorFinancialProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [records, setRecords] = useState<VendorFinancialRecord[]>([]);
  const { vendorEmail } = useVendorEmail();

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/vendors/financials?vendorEmail=${encodeURIComponent(vendorEmail)}`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.items)) {
      const local = readLocal();
      const map = new Map<string, VendorFinancialRecord>();
      for (const item of data.items as VendorFinancialRecord[]) {
        map.set(`${item.eventName}|${item.eventDate}`, item);
      }
      for (const item of local) {
        const key = `${item.eventName}|${item.eventDate}`;
        const ex = map.get(key);
        if (!ex || item.updatedAt > ex.updatedAt) map.set(key, item);
      }
      const merged = Array.from(map.values()).sort((a, b) => b.eventDate.localeCompare(a.eventDate));
      setRecords(merged);
      writeLocal(merged);
    }
  }, [vendorEmail]);

  useEffect(() => {
    const local = readLocal();
    if (local.length) setRecords(local);
    refresh().finally(() => setReady(true));
  }, [refresh, vendorEmail]);

  const upsertFinancial = useCallback(
    async (record: Omit<FinancialRecord, 'id'>, source: 'import' | 'quick-log' = 'import') => {
      const input = financialFromRecord({ ...record, id: `fin-${Date.now()}` }, source);
      const res = await fetch('/api/vendors/financials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorEmail, financial: input }),
      });
      const data = await res.json();
      const saved: VendorFinancialRecord = data.financial ?? {
        id: `fin-${Date.now()}`,
        vendorEmail,
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRecords(prev => {
        const next = prev.filter(
          r => !(r.eventName === saved.eventName && r.eventDate === saved.eventDate)
        );
        next.unshift(saved);
        writeLocal(next);
        return next;
      });
      return recordFromFinancial(saved);
    },
    [vendorEmail]
  );

  const financials = useMemo(() => records.map(recordFromFinancial), [records]);

  const value = useMemo(
    () => ({ ready, financials, refresh, upsertFinancial }),
    [ready, financials, refresh, upsertFinancial]
  );

  return (
    <VendorFinancialContext.Provider value={value}>{children}</VendorFinancialContext.Provider>
  );
}

export function useVendorFinancial() {
  const ctx = useContext(VendorFinancialContext);
  if (!ctx) throw new Error('useVendorFinancial must be used within VendorFinancialProvider');
  return ctx;
}
