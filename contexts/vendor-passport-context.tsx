'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEMO_VENDOR_EMAIL,
  mockVendorPassport,
  validatePassport,
  type PassportValidation,
  type VendorPassport,
} from '@/lib/vendor-passport';
import { useVendorEmail } from '@/lib/hooks/use-vendor-email';
import type { DocumentType } from '@/lib/documents';

const STORAGE_KEY = 'vendorflow-passport-v1';

interface VendorPassportContextValue {
  ready: boolean;
  vendorEmail: string;
  passport: VendorPassport;
  validation: PassportValidation;
  saving: boolean;
  updatePassport: (patch: Partial<VendorPassport>) => Promise<void>;
  addDocument: (type: DocumentType, fileName: string) => Promise<void>;
  removeDocument: (docId: string) => Promise<void>;
  setSetupPhoto: (url: string | undefined) => Promise<void>;
  refreshFromServer: () => Promise<void>;
  resetToDemo: () => void;
}

const VendorPassportContext = createContext<VendorPassportContextValue | null>(null);

function readLocal(): VendorPassport | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VendorPassport) : null;
  } catch {
    return null;
  }
}

function writeLocal(passport: VendorPassport) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passport));
  } catch {
    /* quota */
  }
}

async function syncToServer(passport: VendorPassport) {
  await fetch('/api/vendors/passport', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sync: true, passport }),
  });
}

async function putToServer(vendorEmail: string, patch: Partial<VendorPassport>) {
  const res = await fetch('/api/vendors/passport', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendorEmail, ...patch }),
  });
  return res.json();
}

export function VendorPassportProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passport, setPassport] = useState<VendorPassport>(mockVendorPassport);
  const { vendorEmail, isSignedIn } = useVendorEmail();

  const validation = useMemo(() => validatePassport(passport), [passport]);

  const applyPassport = useCallback((next: VendorPassport) => {
    setPassport(next);
    writeLocal(next);
  }, []);

  const refreshFromServer = useCallback(async () => {
    const res = await fetch(`/api/vendors/passport?vendorEmail=${encodeURIComponent(vendorEmail)}`);
    const data = await res.json();
    if (data.ok && data.passport) {
      applyPassport(data.passport);
    }
  }, [applyPassport, vendorEmail]);

  useEffect(() => {
    const local = readLocal();
    if (local && !isSignedIn) {
      setPassport(local);
      syncToServer(local).catch(() => {});
    } else if (!isSignedIn) {
      syncToServer(mockVendorPassport).catch(() => {});
    }
    refreshFromServer().finally(() => setReady(true));
  }, [refreshFromServer, vendorEmail, isSignedIn]);

  const persist = useCallback(
    async (patch: Partial<VendorPassport>) => {
      setSaving(true);
      const merged = {
        ...passport,
        ...patch,
        logistics: patch.logistics ? { ...passport.logistics, ...patch.logistics } : passport.logistics,
        updatedAt: new Date().toISOString(),
      };
      applyPassport(merged);
      try {
        const data = await putToServer(merged.vendorEmail, patch);
        if (data.ok && data.passport) applyPassport(data.passport);
      } catch {
        /* keep local */
      } finally {
        setSaving(false);
      }
    },
    [passport, applyPassport]
  );

  const updatePassport = useCallback(
    (patch: Partial<VendorPassport>) => persist(patch),
    [persist]
  );

  const addDocument = useCallback(
    async (type: DocumentType, fileName: string) => {
      const doc = {
        id: `doc-${Date.now()}`,
        type,
        fileName,
        uploadedAt: new Date().toISOString(),
      };
      const documents = [...passport.documents.filter(d => d.type !== type), doc];
      await persist({ documents });
    },
    [passport.documents, persist]
  );

  const removeDocument = useCallback(
    async (docId: string) => {
      await persist({ documents: passport.documents.filter(d => d.id !== docId) });
    },
    [passport.documents, persist]
  );

  const setSetupPhoto = useCallback(
    async (url: string | undefined) => {
      await persist({ setupPhotoUrl: url });
    },
    [persist]
  );

  const resetToDemo = useCallback(() => {
    applyPassport(structuredClone(mockVendorPassport));
    syncToServer(mockVendorPassport).catch(() => {});
  }, [applyPassport]);

  const value = useMemo(
    () => ({
      ready,
      vendorEmail,
      passport,
      validation,
      saving,
      updatePassport,
      addDocument,
      removeDocument,
      setSetupPhoto,
      refreshFromServer,
      resetToDemo,
    }),
    [
      ready,
      vendorEmail,
      passport,
      validation,
      saving,
      updatePassport,
      addDocument,
      removeDocument,
      setSetupPhoto,
      refreshFromServer,
      resetToDemo,
    ]
  );

  return (
    <VendorPassportContext.Provider value={value}>{children}</VendorPassportContext.Provider>
  );
}

export function useVendorPassport() {
  const ctx = useContext(VendorPassportContext);
  if (!ctx) throw new Error('useVendorPassport must be used within VendorPassportProvider');
  return ctx;
}
