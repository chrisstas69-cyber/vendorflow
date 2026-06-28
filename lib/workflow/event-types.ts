/** Structured workflow event names for activity feed + notifications */

export const WorkflowEventType = {
  APPLICATION_SUBMITTED: 'application.submitted',
  APPLICATION_APPROVED: 'application.approved',
  APPLICATION_REJECTED: 'application.rejected',
  APPLICATION_WAITLISTED: 'application.waitlisted',
  APPLICATION_INFO_REQUESTED: 'application.info_requested',
  DOCUMENT_MISSING: 'document.missing',
  INSURANCE_EXPIRING: 'insurance.expiring',
  PAYMENT_RECEIVED: 'payment.received',
  BOOTH_ASSIGNED: 'booth.assigned',
  BOOTH_CLEARED: 'booth.cleared',
  CONTRACT_SIGNED: 'contract.signed',
  EVENT_PUBLISHED: 'event.published',
  REFUND_REQUESTED: 'refund.requested',
  MESSAGE_RECEIVED: 'message.received',
} as const;

export type WorkflowEventTypeName = (typeof WorkflowEventType)[keyof typeof WorkflowEventType];

export interface ActivityFeedDTO {
  id: string;
  eventType: string;
  actorType: string;
  actorId: string | null;
  actorLabel: string | null;
  targetType: string;
  targetId: string | null;
  targetLabel: string | null;
  title: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  eventId: string | null;
  createdAt: string;
}
