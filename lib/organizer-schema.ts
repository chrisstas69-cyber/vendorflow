/** Organizer intelligence — series, pipeline stages, inbox actions */

export type OrganizerPipelineStage =
  | 'scraped'
  | 'applied'
  | 'reviewing'
  | 'approved'
  | 'waitlisted';

/** Visual Kanban columns shown on organizer dashboard */
export type OrganizerDisplayStage =
  | 'applied'
  | 'docs'
  | 'approved'
  | 'mapped'
  | 'paid'
  | 'completed';

export type PaymentStatus = 'none' | 'invoiced' | 'partial' | 'paid';
export type ContractStatus = 'unsigned' | 'sent' | 'signed';

export type InboxAction = 'accept' | 'waitlist' | 'request_info' | 'reject';

export interface OrganizerApplicationInboxItem {
  id: string;
  submissionId: string;
  eventId: string;
  eventName: string;
  seriesId?: string;
  seriesName?: string;
  vendorName: string;
  vendorEmail: string;
  category: string;
  message: string;
  pipelineStage: OrganizerPipelineStage;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  hasInsurance: boolean;
  setupPhotoUrl?: string;
  shortlisted: boolean;
  infoRequested: boolean;
  documentsCount: number;
  requiredForms: string[];
  uploadedDocTypes: string[];
  missingDocTypes: string[];
  boothId?: string;
  paymentStatus: PaymentStatus;
  contractStatus: ContractStatus;
  displayStage: OrganizerDisplayStage;
}

export const DISPLAY_PIPELINE_COLUMNS: {
  id: OrganizerDisplayStage;
  label: string;
  description: string;
}[] = [
  { id: 'applied', label: 'Applied', description: 'New applications' },
  { id: 'docs', label: 'Docs', description: 'Paperwork & compliance' },
  { id: 'approved', label: 'Approved', description: 'Confirmed vendors' },
  { id: 'mapped', label: 'Mapped', description: 'Booth assigned' },
  { id: 'paid', label: 'Paid', description: 'Deposit received' },
  { id: 'completed', label: 'Completed', description: 'Event done' },
];

export const PIPELINE_COLUMNS: {
  id: OrganizerPipelineStage;
  label: string;
  description: string;
}[] = [
  { id: 'scraped', label: 'Scraped', description: 'Sourced leads & saved vendors' },
  { id: 'applied', label: 'Applied', description: 'New applications inbox' },
  { id: 'reviewing', label: 'Reviewing', description: 'Shortlisted or awaiting info' },
  { id: 'approved', label: 'Approved', description: 'Confirmed for the event' },
];

export const SIDEBAR_PIPELINE_STAGES: OrganizerPipelineStage[] = [
  'scraped',
  'applied',
  'reviewing',
  'approved',
];

export function pipelineStageLabel(stage: OrganizerPipelineStage): string {
  return PIPELINE_COLUMNS.find(c => c.id === stage)?.label ?? stage;
}

export function missingDocTypes(
  required: string[],
  uploaded: string[]
): string[] {
  return required.filter(r => !uploaded.includes(r));
}

export function deriveDisplayStage(input: {
  pipelineStage: OrganizerPipelineStage;
  status: 'pending' | 'approved' | 'rejected';
  requiredForms: string[];
  uploadedDocTypes: string[];
  boothId?: string;
  paymentStatus: PaymentStatus;
  eventDate?: string;
  infoRequested?: boolean;
}): OrganizerDisplayStage {
  const missing = missingDocTypes(input.requiredForms, input.uploadedDocTypes);
  const eventPast = input.eventDate ? new Date(input.eventDate) < new Date() : false;

  if (input.status === 'approved') {
    if (input.paymentStatus === 'paid' && eventPast) return 'completed';
    if (input.paymentStatus === 'paid' || input.paymentStatus === 'partial') return 'paid';
    if (input.boothId) return 'mapped';
    return 'approved';
  }

  if (input.pipelineStage === 'scraped') return 'applied';

  if (
    input.pipelineStage === 'reviewing' ||
    input.infoRequested ||
    (input.pipelineStage === 'applied' && missing.length > 0)
  ) {
    return 'docs';
  }

  return 'applied';
}

export function deriveDisplayStageFromItem(
  item: Pick<
    OrganizerApplicationInboxItem,
    | 'pipelineStage'
    | 'status'
    | 'requiredForms'
    | 'uploadedDocTypes'
    | 'boothId'
    | 'paymentStatus'
    | 'infoRequested'
  > & { eventDate?: string }
): OrganizerDisplayStage {
  return deriveDisplayStage({
    pipelineStage: item.pipelineStage,
    status: item.status,
    requiredForms: item.requiredForms,
    uploadedDocTypes: item.uploadedDocTypes,
    boothId: item.boothId,
    paymentStatus: item.paymentStatus,
    eventDate: item.eventDate,
    infoRequested: item.infoRequested,
  });
}

export function derivePipelineStage(input: {
  status: 'pending' | 'approved' | 'rejected';
  pipelineStage?: OrganizerPipelineStage;
  shortlisted?: boolean;
  infoRequested?: boolean;
}): OrganizerPipelineStage {
  if (input.pipelineStage === 'waitlisted') return 'waitlisted';
  if (input.status === 'approved') return 'approved';
  if (input.status === 'rejected') return 'applied';
  if (input.pipelineStage === 'scraped') return 'scraped';
  if (input.shortlisted || input.infoRequested || input.pipelineStage === 'reviewing') {
    return 'reviewing';
  }
  if (input.pipelineStage === 'applied') return 'applied';
  return input.status === 'pending' ? 'applied' : 'applied';
}

export function applyInboxAction(
  current: OrganizerPipelineStage,
  action: InboxAction
): { pipelineStage: OrganizerPipelineStage; status: 'pending' | 'approved' | 'rejected' } {
  switch (action) {
    case 'accept':
      return { pipelineStage: 'approved', status: 'approved' };
    case 'waitlist':
      return { pipelineStage: 'waitlisted', status: 'pending' };
    case 'request_info':
      return { pipelineStage: 'reviewing', status: 'pending' };
    case 'reject':
      return { pipelineStage: 'applied', status: 'rejected' };
    default:
      return { pipelineStage: current, status: 'pending' };
  }
}
