import type { Application, ApplicationStatus } from '@/lib/mock-data';
import type { DocumentType } from '@/lib/documents';
import {
  deriveDisplayStage,
  type ContractStatus,
  type OrganizerPipelineStage,
  type PaymentStatus,
} from '@/lib/organizer-schema';
import { mockPlatformEvents } from '@/lib/platform-data';

export interface VendorApplicationRow {
  id: string;
  eventId: string;
  eventName: string;
  vendorEmail: string;
  vendorName: string;
  category: string;
  message: string;
  status: string;
  pipelineStage: string;
  shortlisted: boolean;
  infoRequested: boolean;
  requiredForms: string;
  uploadedDocTypes: string;
  setupPhotoUrl: string | null;
  hasInsurance: boolean;
  paymentStatus: string;
  contractStatus: string;
  ce200SentAt?: Date | null;
  createdAt: Date;
  boothAssignment?: { boothLabel: string } | null;
}

function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function deriveVendorPipelineStatus(row: VendorApplicationRow): ApplicationStatus {
  const paymentStatus = row.paymentStatus as PaymentStatus;
  const boothId = row.boothAssignment?.boothLabel;
  if (paymentStatus === 'paid' && boothId) return 'booked';
  if (paymentStatus === 'paid') return 'paid';
  const uploaded = parseJsonArray(row.uploadedDocTypes);
  const contractStatus = row.contractStatus as ContractStatus;
  if (
    uploaded.length > 0 ||
    contractStatus === 'sent' ||
    contractStatus === 'signed' ||
    row.ce200SentAt
  ) {
    return 'coi';
  }
  if (row.pipelineStage === 'scraped') return 'scraped';
  return 'applied';
}

export function vendorApplicationMicroStatus(row: VendorApplicationRow): string {
  if (row.status === 'rejected') return 'Application not approved';
  if (row.infoRequested) return 'Organizer requested more information';
  if (row.pipelineStage === 'waitlisted') return 'On waitlist';
  if (row.pipelineStage === 'reviewing') return 'Under review';
  if (row.status === 'approved' && row.paymentStatus === 'paid') {
    return row.boothAssignment
      ? `Booked — booth ${row.boothAssignment.boothLabel}`
      : 'Paid — awaiting booth assignment';
  }
  if (row.status === 'approved') return 'Approved — complete paperwork or payment';
  const contractStatus = row.contractStatus as ContractStatus;
  if (contractStatus === 'sent') return 'CE200 sent — sign and return';
  if (contractStatus === 'signed') return 'Contract signed — awaiting approval';
  return 'Application submitted — organizer reviewing';
}

export function vendorApplicationPublicStatus(row: VendorApplicationRow): string {
  if (row.status === 'rejected') return 'Not approved';
  if (row.infoRequested) return 'Info requested';
  if (row.pipelineStage === 'waitlisted') return 'Waitlisted';
  if (row.pipelineStage === 'reviewing' || row.status === 'pending') return 'Under review';
  if (row.status === 'approved') return 'Approved';
  if (row.contractStatus === 'sent') return 'CE200 sent';
  return 'Applied';
}

export function dbRowToVendorApplication(row: VendorApplicationRow): Application {
  const requiredForms = parseJsonArray(row.requiredForms);
  const uploadedDocTypes = parseJsonArray(row.uploadedDocTypes);
  const event = mockPlatformEvents.find(e => e.id === row.eventId);
  const pipelineStage = row.pipelineStage as OrganizerPipelineStage;
  const paymentStatus = row.paymentStatus as PaymentStatus;
  const contractStatus = row.contractStatus as ContractStatus;
  const boothId = row.boothAssignment?.boothLabel;

  deriveDisplayStage({
    pipelineStage,
    status: row.status as 'pending' | 'approved' | 'rejected',
    requiredForms,
    uploadedDocTypes,
    boothId,
    paymentStatus,
    eventDate: event?.date,
    infoRequested: row.infoRequested,
  });

  const documents = uploadedDocTypes.map(type => ({
    id: `doc-${row.id}-${type}`,
    type: type as DocumentType,
    fileName: `${type.toUpperCase()}_${row.vendorName.replace(/\s+/g, '')}.pdf`,
    uploadedAt: row.createdAt.toISOString(),
  }));

  return {
    id: row.id,
    eventId: row.eventId,
    eventName: row.eventName,
    organizerName: event?.organizerName,
    submissionId: row.id,
    status: deriveVendorPipelineStatus(row),
    microStatus: vendorApplicationMicroStatus(row),
    boothFee: event?.boothFee ?? 350,
    coiAttached: uploadedDocTypes.includes('coi'),
    paid: paymentStatus === 'paid',
    documents,
    requiredForms,
    ce200Sent:
      contractStatus === 'sent' ||
      contractStatus === 'signed' ||
      Boolean(row.ce200SentAt),
    setupPhotoUrl: row.setupPhotoUrl ?? undefined,
  };
}
