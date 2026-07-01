import type { VendorSubmission } from '@/lib/platform-data';
import type { DocumentType, VendorDocument } from '@/lib/documents';
import { DOCUMENT_LABELS } from '@/lib/documents';
import { missingDocTypes } from '@/lib/organizer-schema';

export interface ApplicationHistoryEntry {
  id: string;
  eventName: string;
  eventId: string;
  status: 'approved' | 'rejected' | 'pending' | 'cancelled';
  date: string;
  note?: string;
}

export interface ApplicationDetailView {
  submission: VendorSubmission;
  uploaded: DocumentType[];
  missing: DocumentType[];
  docSummary: { received: number; total: number; expiringSoon: number };
  /** Mock / passport scaffold */
  snapshot: {
    businessName: string;
    category: string;
    contactName: string;
    email: string;
    phone: string;
    serviceArea: string;
    yearsActive: number | null;
    trustSummary: string;
    setupPhotoUrl?: string;
  };
  application: {
    eventName: string;
    eventId: string;
    submittedAt: string;
    boothRequest?: string;
    specialRequirements?: string;
    description: string;
    hasInsurance: boolean;
  };
  documents: {
    type: DocumentType;
    label: string;
    fileName?: string;
    status: 'received' | 'missing' | 'expired' | 'needs_review';
    uploadedAt?: string;
  }[];
  history: ApplicationHistoryEntry[];
  internalNotes: string[];
}

const MOCK_PASSPORT: Record<string, Partial<ApplicationDetailView['snapshot']>> = {
  'glow@example.com': {
    contactName: 'Alex Rivera',
    phone: '(732) 555-0142',
    serviceArea: 'NJ · NYC metro',
    yearsActive: 4,
    trustSummary: 'Repeat vendor — strong COI, complete docs, paid on time at Spring Fest.',
  },
  'fun@example.com': {
    contactName: 'Jamie Park',
    phone: '(516) 555-0198',
    serviceArea: 'Nassau County',
    yearsActive: 6,
    trustSummary: 'School fair specialist — high family engagement, photos match passport.',
  },
  'bbq@example.com': {
    contactName: 'Marcus Williams',
    phone: '(201) 555-0177',
    serviceArea: 'Hudson County, NJ',
    yearsActive: 8,
    trustSummary: 'Food truck — health permit pending review for this event.',
  },
};

function docStatus(
  type: DocumentType,
  uploaded: VendorDocument[],
  missing: DocumentType[]
): ApplicationDetailView['documents'][0]['status'] {
  const doc = uploaded.find(d => d.type === type);
  if (!doc) return missing.includes(type) ? 'missing' : 'needs_review';
  const age = Date.now() - new Date(doc.uploadedAt).getTime();
  if (age > 365 * 24 * 60 * 60 * 1000) return 'expired';
  return 'received';
}

export function buildApplicationDetail(
  sub: VendorSubmission,
  allSubmissions: VendorSubmission[]
): ApplicationDetailView {
  const requiredForms = sub.requiredForms ?? [];
  const documents = sub.documents ?? [];
  const uploaded = documents.map(d => d.type);
  const missing = missingDocTypes(requiredForms, uploaded) as DocumentType[];
  const mock = MOCK_PASSPORT[sub.vendorEmail] ?? {};
  const message = sub.message ?? '';
  const category = sub.category ?? '';

  const history: ApplicationHistoryEntry[] = allSubmissions
    .filter(s => s.vendorEmail === sub.vendorEmail && s.id !== sub.id)
    .map(s => ({
      id: s.id,
      eventName: s.eventName,
      eventId: s.eventId,
      status: s.status,
      date: s.submittedAt,
      note: s.status === 'rejected' ? 'Did not meet category mix' : undefined,
    }));

  if (history.length === 0) {
    history.push({
      id: 'hist-placeholder',
      eventName: 'No prior events on VendorFlow',
      eventId: '',
      status: 'pending',
      date: sub.submittedAt,
      note: 'First application in pilot data',
    });
  }

  const expiringSoon = documents.filter(d => {
    const age = Date.now() - new Date(d.uploadedAt).getTime();
    return age > 330 * 24 * 60 * 60 * 1000 && age < 365 * 24 * 60 * 60 * 1000;
  }).length;

  return {
    submission: sub,
    uploaded,
    missing,
    docSummary: {
      received: uploaded.length,
      total: requiredForms.length,
      expiringSoon,
    },
    snapshot: {
      businessName: sub.vendorName,
      category: sub.category,
      contactName: mock.contactName ?? sub.vendorName.split(' ')[0] + ' (contact)',
      email: sub.vendorEmail,
      phone: mock.phone ?? '—',
      serviceArea: mock.serviceArea ?? 'Long Island · NY/NJ',
      yearsActive: mock.yearsActive ?? null,
      trustSummary:
        mock.trustSummary ??
        (sub.hasInsurance
          ? 'Insurance on file — complete passport for full trust score.'
          : 'COI not confirmed — request before approving.'),
      setupPhotoUrl: sub.setupPhotoUrl,
    },
    application: {
      eventName: sub.eventName,
      eventId: sub.eventId,
      submittedAt: sub.submittedAt,
      boothRequest: sub.boothId ? `Booth ${sub.boothId}` : '10×10 standard (requested)',
      specialRequirements: message.includes('electric')
        ? 'Electric hookup requested'
        : category.toLowerCase().includes('food')
          ? 'Health dept permit required'
          : undefined,
      description: message,
      hasInsurance: sub.hasInsurance,
    },
    documents: requiredForms.map(type => {
      const t = type as DocumentType;
      const doc = documents.find(d => d.type === t);
      return {
        type: t,
        label: DOCUMENT_LABELS[t] ?? t,
        fileName: doc?.fileName,
        status: docStatus(t, documents, missing),
        uploadedAt: doc?.uploadedAt,
      };
    }),
    history,
    internalNotes: sub.infoRequested
      ? ['Info requested — awaiting vendor reply']
      : sub.shortlisted
        ? ['Shortlisted by organizer']
        : [],
  };
}
