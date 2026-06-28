/** Operational event timeline stages — UI built in Run 2 */

export const EVENT_TIMELINE_STAGES = [
  { id: 'planning', label: 'Planning', order: 0 },
  { id: 'applications_open', label: 'Applications Open', order: 1 },
  { id: 'applications_closed', label: 'Applications Closed', order: 2 },
  { id: 'review', label: 'Review', order: 3 },
  { id: 'vendor_approved', label: 'Vendor Approved', order: 4 },
  { id: 'contracts', label: 'Contracts', order: 5 },
  { id: 'payments', label: 'Payments', order: 6 },
  { id: 'booth_assignment', label: 'Booth Assignment', order: 7 },
  { id: 'load_in', label: 'Load In', order: 8 },
  { id: 'event_day', label: 'Event Day', order: 9 },
  { id: 'breakdown', label: 'Breakdown', order: 10 },
  { id: 'post_event', label: 'Post Event Analytics', order: 11 },
] as const;

export type EventTimelineStageId = (typeof EVENT_TIMELINE_STAGES)[number]['id'];

export interface EventTimelineStageState {
  id: EventTimelineStageId;
  label: string;
  status: 'pending' | 'active' | 'complete';
  completedAt?: string;
}

export function defaultTimelineStages(currentStage: EventTimelineStageId = 'review'): EventTimelineStageState[] {
  const currentIdx = EVENT_TIMELINE_STAGES.findIndex(s => s.id === currentStage);
  return EVENT_TIMELINE_STAGES.map((s, idx) => ({
    id: s.id,
    label: s.label,
    status: idx < currentIdx ? 'complete' : idx === currentIdx ? 'active' : 'pending',
    completedAt: idx < currentIdx ? new Date().toISOString() : undefined,
  }));
}
