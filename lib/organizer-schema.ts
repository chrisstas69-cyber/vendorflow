/** Organizer intelligence — series, pipeline stages, inbox actions */

export type OrganizerPipelineStage =
  | 'scraped'
  | 'applied'
  | 'reviewing'
  | 'approved'
  | 'waitlisted';

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
}

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
