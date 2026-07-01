import type { OrganizerApplicationInboxItem } from '@/lib/organizer-schema';
import type { VendorSubmission } from '@/lib/platform-data';
import type { DocumentType } from '@/lib/documents';

/** Map API inbox item → VendorSubmission shape for drawer/detail helpers */
export function inboxItemToVendorSubmission(item: OrganizerApplicationInboxItem): VendorSubmission {
  const requiredForms = (item.requiredForms ?? []) as DocumentType[];
  const uploaded = (item.uploadedDocTypes ?? []) as DocumentType[];

  return {
    id: item.submissionId || item.id,
    eventId: item.eventId,
    eventName: item.eventName,
    vendorName: item.vendorName ?? 'Vendor',
    vendorEmail: item.vendorEmail ?? '',
    category: item.category ?? 'General',
    message: item.message ?? '',
    status: item.status,
    pipelineStage: item.pipelineStage,
    infoRequested: item.infoRequested,
    submittedAt: item.submittedAt,
    hasInsurance: item.hasInsurance,
    requiredForms,
    documents: uploaded.map(type => ({
      id: `doc-${item.id}-${type}`,
      type,
      fileName: `${type.toUpperCase()}_${item.vendorName.replace(/\s+/g, '')}.pdf`,
      uploadedAt: item.submittedAt,
    })),
    setupPhotoUrl: item.setupPhotoUrl,
    shortlisted: item.shortlisted,
    boothId: item.boothId,
    paymentStatus: item.paymentStatus,
    contractStatus: item.contractStatus,
    applicationId: item.id,
    internalNotes: item.internalNotes,
  };
}

export function inboxItemsToSubmissions(items: OrganizerApplicationInboxItem[]): VendorSubmission[] {
  return items.map(inboxItemToVendorSubmission);
}
