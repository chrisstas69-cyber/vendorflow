'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  mockApplications,
  mockFinancials,
  type Application,
  type FinancialRecord,
} from '@/lib/mock-data';
import {
  DEMO_ORGANIZER_ID,
  mockPlatformEvents,
  mockVendorSubmissions,
  toVendorEvent,
  type PlatformEvent,
  type VendorSubmission,
} from '@/lib/platform-data';
import { DEFAULT_EVENT_IMAGE } from '@/lib/event-images';
import type { MockEvent } from '@/lib/mock-data';
import {
  getRequiredForms,
  type DocumentType,
  type VendorDocument,
} from '@/lib/documents';

import { resolveSetupPhoto } from '@/lib/vendor-setup';

const STORAGE_KEY = 'vendorflow-platform-v4';

interface StoredState {
  applications?: Application[];
  financials?: FinancialRecord[];
  events?: PlatformEvent[];
  submissions?: VendorSubmission[];
}

interface PlatformStore {
  ready: boolean;
  events: PlatformEvent[];
  applications: Application[];
  financials: FinancialRecord[];
  submissions: VendorSubmission[];
  publishedEvents: PlatformEvent[];
  getEvent: (id: string) => PlatformEvent | undefined;
  getEventBySlug: (slug: string) => PlatformEvent | undefined;
  applyToEvent: (event: MockEvent) => { ok: boolean; message: string };
  submitVendorApplication: (data: {
    eventId: string;
    vendorName: string;
    vendorEmail: string;
    category: string;
    message: string;
    hasInsurance: boolean;
    setupPhotoUrl?: string;
  }) => { ok: boolean; message: string };
  updateApplication: (id: string, patch: Partial<Application>) => void;
  updateSubmission: (id: string, patch: Partial<VendorSubmission>) => void;
  updateSetupPhoto: (applicationId: string, setupPhotoUrl: string | undefined) => void;
  toggleShortlist: (submissionId: string) => void;
  uploadApplicationDocument: (
    applicationId: string,
    type: DocumentType,
    fileName: string
  ) => { ok: boolean; message: string };
  uploadSubmissionDocument: (
    submissionId: string,
    type: DocumentType,
    fileName: string
  ) => { ok: boolean; message: string };
  sendCe200Email: (submissionId: string) => { ok: boolean; message: string };
  approveSubmission: (submissionId: string) => { ok: boolean; message: string };
  downloadVendorPacket: (submissionId: string) => void;
  createEvent: (event: Omit<PlatformEvent, 'id' | 'slug' | 'views' | 'saves' | 'vendorSlotsFilled'>) => PlatformEvent;
  claimEvent: (eventId: string) => void;
  importFinancial: (record: Omit<FinancialRecord, 'id'>) => void;
  incrementViews: (eventId: string) => void;
  resetDemo: () => void;
}

const PlatformStoreContext = createContext<PlatformStore | null>(null);

function readStorage(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeApplication(app: Application): Application {
  return {
    ...app,
    documents: app.documents ?? [],
    requiredForms: app.requiredForms ?? ['coi', 'ce200', 'w9'],
    ce200Sent: app.ce200Sent ?? false,
    setupPhotoUrl: app.setupPhotoUrl,
  };
}

function normalizeSubmission(sub: VendorSubmission): VendorSubmission {
  const event = mockPlatformEvents.find(e => e.id === sub.eventId);
  return {
    ...sub,
    documents: sub.documents ?? [],
    requiredForms: sub.requiredForms ?? getRequiredForms(event?.category ?? 'festival'),
    setupPhotoUrl: sub.setupPhotoUrl ?? resolveSetupPhoto(sub.vendorEmail, sub.category),
    shortlisted: sub.shortlisted ?? false,
  };
}

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [events, setEvents] = useState<PlatformEvent[]>(mockPlatformEvents);
  const [applications, setApplications] = useState<Application[]>(
    mockApplications.map(normalizeApplication)
  );
  const [financials, setFinancials] = useState<FinancialRecord[]>(mockFinancials);
  const [submissions, setSubmissions] = useState<VendorSubmission[]>(
    mockVendorSubmissions.map(normalizeSubmission)
  );

  useEffect(() => {
    const saved = readStorage();
    if (saved?.events?.length) setEvents(saved.events);
    if (saved?.applications?.length) {
      setApplications(saved.applications.map(normalizeApplication));
    }
    if (saved?.financials?.length) setFinancials(saved.financials);
    if (saved?.submissions?.length) {
      setSubmissions(saved.submissions.map(normalizeSubmission));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ events, applications, financials, submissions })
    );
  }, [events, applications, financials, submissions, ready]);

  const publishedEvents = useMemo(
    () => events.filter(e => e.listingStatus === 'published').sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );

  const getEvent = useCallback((id: string) => events.find(e => e.id === id), [events]);
  const getEventBySlug = useCallback((slug: string) => events.find(e => e.slug === slug), [events]);

  const applyToEvent = useCallback(
    (event: MockEvent) => {
      const platformEvent = events.find(e => e.id === event.id);
      const exists = applications.some(
        a => a.eventId === event.id || a.eventName.toLowerCase() === event.name.toLowerCase()
      );
      if (exists) return { ok: false, message: 'Already in your pipeline — check Command Center' };

      const requiredForms = getRequiredForms(platformEvent?.category ?? 'festival');
      const app: Application = {
        id: `app-${Date.now()}`,
        eventId: event.id,
        eventName: event.name,
        organizerName: platformEvent?.organizerName,
        status: 'scraped',
        microStatus: 'Saved — review details and submit when ready',
        boothFee: event.boothFee,
        coiAttached: false,
        paid: false,
        documents: [],
        requiredForms,
        ce200Sent: false,
        deadline: platformEvent?.applicationDeadline,
      };
      setApplications(prev => [app, ...prev]);
      return { ok: true, message: `Added ${event.name} to your pipeline` };
    },
    [applications, events]
  );

  const submitVendorApplication = useCallback(
    (data: {
      eventId: string;
      vendorName: string;
      vendorEmail: string;
      category: string;
      message: string;
      hasInsurance: boolean;
      setupPhotoUrl?: string;
    }) => {
      const event = events.find(e => e.id === data.eventId);
      if (!event) return { ok: false, message: 'Event not found' };

      const dup = submissions.some(
        s =>
          s.eventId === data.eventId &&
          s.vendorEmail === data.vendorEmail &&
          s.status !== 'rejected'
      );
      if (dup) return { ok: false, message: 'You already applied to this event' };

      const requiredForms = getRequiredForms(event.category);
      const appId = `app-${Date.now()}`;
      const subId = `sub-${Date.now()}`;

      const initialDocs: VendorDocument[] = data.hasInsurance
        ? [{
            id: `doc-${Date.now()}`,
            type: 'coi',
            fileName: `COI_${data.vendorName.replace(/\s+/g, '_')}.pdf`,
            uploadedAt: new Date().toISOString(),
          }]
        : [];

      const sub: VendorSubmission = {
        id: subId,
        eventId: data.eventId,
        eventName: event.name,
        vendorName: data.vendorName,
        vendorEmail: data.vendorEmail,
        category: data.category,
        message: data.message,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        hasInsurance: data.hasInsurance,
        documents: initialDocs,
        requiredForms,
        applicationId: appId,
        setupPhotoUrl: data.setupPhotoUrl,
        shortlisted: false,
      };
      setSubmissions(prev => [sub, ...prev]);

      setApplications(prev => [
        {
          id: appId,
          eventId: event.id,
          eventName: event.name,
          organizerName: event.organizerName,
          submissionId: subId,
          status: 'applied',
          microStatus: 'Application sent — organizer will review soon',
          boothFee: event.boothFee,
          coiAttached: data.hasInsurance,
          paid: false,
          deadline: event.applicationDeadline,
          documents: initialDocs,
          requiredForms,
          ce200Sent: false,
          setupPhotoUrl: data.setupPhotoUrl,
        },
        ...prev.filter(a => a.eventId !== event.id),
      ]);

      return { ok: true, message: 'Application submitted! Track it in Command Center.' };
    },
    [events, submissions]
  );

  const updateApplication = useCallback((id: string, patch: Partial<Application>) => {
    setApplications(prev => prev.map(a => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const updateSubmission = useCallback((id: string, patch: Partial<VendorSubmission>) => {
    setSubmissions(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const updateSetupPhoto = useCallback((applicationId: string, setupPhotoUrl: string | undefined) => {
    setApplications(prev =>
      prev.map(a => (a.id === applicationId ? { ...a, setupPhotoUrl } : a))
    );
    const app = applications.find(a => a.id === applicationId);
    if (app?.submissionId) {
      setSubmissions(prev =>
        prev.map(s => (s.id === app.submissionId ? { ...s, setupPhotoUrl } : s))
      );
    }
  }, [applications]);

  const toggleShortlist = useCallback((submissionId: string) => {
    setSubmissions(prev =>
      prev.map(s =>
        s.id === submissionId ? { ...s, shortlisted: !s.shortlisted } : s
      )
    );
  }, []);

  const uploadApplicationDocument = useCallback(
    (applicationId: string, type: DocumentType, fileName: string) => {
      const app = applications.find(a => a.id === applicationId);
      if (!app) return { ok: false, message: 'Application not found' };

      const doc: VendorDocument = {
        id: `doc-${Date.now()}`,
        type,
        fileName,
        uploadedAt: new Date().toISOString(),
      };

      const documents = [...app.documents.filter(d => d.type !== type), doc];
      const coiAttached = type === 'coi' ? true : app.coiAttached;
      const hasAllRequired = app.requiredForms.every(r =>
        documents.some(d => d.type === r)
      );

      setApplications(prev =>
        prev.map(a =>
          a.id === applicationId
            ? {
                ...a,
                documents,
                coiAttached,
                status: hasAllRequired && a.status === 'applied' ? 'coi' : a.status,
                microStatus:
                  type === 'ce200'
                    ? 'Signed CE200 uploaded — sent back to organizer'
                    : `${DOCUMENT_LABELS_SHORT[type]} submitted to organizer`,
              }
            : a
        )
      );

      if (app.submissionId) {
        setSubmissions(prev =>
          prev.map(s =>
            s.id === app.submissionId
              ? { ...s, documents: [...s.documents.filter(d => d.type !== type), doc], hasInsurance: coiAttached }
              : s
          )
        );
      }

      return { ok: true, message: `${DOCUMENT_LABELS_SHORT[type]} uploaded` };
    },
    [applications]
  );

  const uploadSubmissionDocument = useCallback(
    (submissionId: string, type: DocumentType, fileName: string) => {
      const sub = submissions.find(s => s.id === submissionId);
      if (!sub) return { ok: false, message: 'Submission not found' };

      const doc: VendorDocument = {
        id: `doc-${Date.now()}`,
        type,
        fileName,
        uploadedAt: new Date().toISOString(),
      };

      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId
            ? {
                ...s,
                documents: [...s.documents.filter(d => d.type !== type), doc],
                hasInsurance: type === 'coi' ? true : s.hasInsurance,
              }
            : s
        )
      );

      if (sub.applicationId) {
        uploadApplicationDocument(sub.applicationId, type, fileName);
      }

      return { ok: true, message: `${DOCUMENT_LABELS_SHORT[type]} uploaded` };
    },
    [submissions, uploadApplicationDocument]
  );

  const sendCe200Email = useCallback(
    (submissionId: string) => {
      const sub = submissions.find(s => s.id === submissionId);
      if (!sub) return { ok: false, message: 'Vendor not found' };
      if (sub.ce200SentAt) return { ok: false, message: 'CE200 already sent to this vendor' };

      const now = new Date().toISOString();
      setSubmissions(prev =>
        prev.map(s => (s.id === submissionId ? { ...s, ce200SentAt: now } : s))
      );

      if (sub.applicationId) {
        setApplications(prev =>
          prev.map(a =>
            a.id === sub.applicationId
              ? {
                  ...a,
                  ce200Sent: true,
                  microStatus: 'Organizer sent CE200 — sign it and upload the signed copy below',
                }
              : a
          )
        );
      }

      return {
        ok: true,
        message: `CE200 sent to ${sub.vendorEmail} — vendor will sign and upload back (demo)`,
      };
    },
    [submissions]
  );

  const approveSubmission = useCallback(
    (submissionId: string) => {
      const sub = submissions.find(s => s.id === submissionId);
      if (!sub) return { ok: false, message: 'Submission not found' };

      setSubmissions(prev =>
        prev.map(s => (s.id === submissionId ? { ...s, status: 'approved' } : s))
      );

      if (sub.applicationId) {
        setApplications(prev =>
          prev.map(a =>
            a.id === sub.applicationId
              ? {
                  ...a,
                  status: a.documents.length >= a.requiredForms.length ? 'coi' : 'applied',
                  microStatus: 'Approved by organizer — complete remaining forms',
                }
              : a
          )
        );
      }

      setEvents(prev =>
        prev.map(e =>
          e.id === sub.eventId
            ? { ...e, vendorSlotsFilled: Math.min(e.vendorSlotsFilled + 1, e.vendorSlots) }
            : e
        )
      );

      return { ok: true, message: `${sub.vendorName} approved for ${sub.eventName}` };
    },
    [submissions]
  );

  const downloadVendorPacket = useCallback(
    (submissionId: string) => {
      const sub = submissions.find(s => s.id === submissionId);
      if (!sub) return;

      const lines = [
        `VendorFlow — Vendor Packet`,
        `Event: ${sub.eventName}`,
        `Vendor: ${sub.vendorName} (${sub.vendorEmail})`,
        `Category: ${sub.category}`,
        `Status: ${sub.status}`,
        `Submitted: ${sub.submittedAt}`,
        '',
        'Documents on file:',
        ...sub.documents.map(d => `  • ${d.fileName} (${d.type})`),
        '',
        sub.ce200SentAt ? `CE200 sent: ${sub.ce200SentAt}` : 'CE200: not yet sent',
      ];

      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sub.vendorName.replace(/\s+/g, '_')}_packet.txt`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [submissions]
  );

  const createEvent = useCallback(
    (input: Omit<PlatformEvent, 'id' | 'slug' | 'views' | 'saves' | 'vendorSlotsFilled'>) => {
      const id = `evt-${Date.now()}`;
      const cover = input.coverImageUrl || DEFAULT_EVENT_IMAGE;
      const event: PlatformEvent = {
        ...input,
        id,
        slug: slugify(input.name),
        views: 0,
        saves: 0,
        vendorSlotsFilled: 0,
        listingStatus: input.listingStatus ?? 'published',
        organizerId: DEMO_ORGANIZER_ID,
        isClaimable: false,
        coverImageUrl: cover,
        galleryUrls: input.galleryUrls?.length ? input.galleryUrls : [cover],
        promotionTier: input.promotionTier ?? 'none',
      };
      setEvents(prev => [event, ...prev]);
      return event;
    },
    []
  );

  const claimEvent = useCallback((eventId: string) => {
    setEvents(prev =>
      prev.map(e =>
        e.id === eventId
          ? {
              ...e,
              organizerId: DEMO_ORGANIZER_ID,
              organizerName: 'My Events Co.',
              isClaimable: false,
            }
          : e
      )
    );
  }, []);

  const importFinancial = useCallback((record: Omit<FinancialRecord, 'id'>) => {
    setFinancials(prev => [{ ...record, id: `fin-${Date.now()}` }, ...prev]);
  }, []);

  const incrementViews = useCallback((eventId: string) => {
    setEvents(prev =>
      prev.map(e => (e.id === eventId ? { ...e, views: e.views + 1 } : e))
    );
  }, []);

  const resetDemo = useCallback(() => {
    setEvents(mockPlatformEvents);
    setApplications(mockApplications.map(normalizeApplication));
    setFinancials(mockFinancials);
    setSubmissions(mockVendorSubmissions.map(normalizeSubmission));
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      events,
      applications,
      financials,
      submissions,
      publishedEvents,
      getEvent,
      getEventBySlug,
      applyToEvent,
      submitVendorApplication,
      updateApplication,
      updateSubmission,
      updateSetupPhoto,
      toggleShortlist,
      uploadApplicationDocument,
      uploadSubmissionDocument,
      sendCe200Email,
      approveSubmission,
      downloadVendorPacket,
      createEvent,
      claimEvent,
      importFinancial,
      incrementViews,
      resetDemo,
    }),
    [
      ready,
      events,
      applications,
      financials,
      submissions,
      publishedEvents,
      getEvent,
      getEventBySlug,
      applyToEvent,
      submitVendorApplication,
      updateApplication,
      updateSubmission,
      updateSetupPhoto,
      toggleShortlist,
      uploadApplicationDocument,
      uploadSubmissionDocument,
      sendCe200Email,
      approveSubmission,
      downloadVendorPacket,
      createEvent,
      claimEvent,
      importFinancial,
      incrementViews,
      resetDemo,
    ]
  );

  return (
    <PlatformStoreContext.Provider value={value}>{children}</PlatformStoreContext.Provider>
  );
}

const DOCUMENT_LABELS_SHORT: Record<DocumentType, string> = {
  coi: 'COI',
  ce200: 'CE200',
  w9: 'W-9',
  'booth-layout': 'Booth layout',
  'vehicle-info': 'Vehicle info',
  'food-permit': 'Food permit',
  other: 'Document',
};

export function useDemoStore() {
  const ctx = useContext(PlatformStoreContext);
  if (!ctx) throw new Error('useDemoStore must be used within DemoStoreProvider');
  return ctx;
}

export function usePlatformStore() {
  return useDemoStore();
}

export { toVendorEvent };
