import { prisma } from '@/lib/prisma';
import type { WorkflowEventTypeName } from '@/lib/workflow/event-types';

export interface EmitActivityInput {
  organizerId: string;
  eventType: WorkflowEventTypeName | string;
  actorType: 'organizer' | 'vendor' | 'system';
  actorId?: string;
  actorLabel?: string;
  targetType: string;
  targetId?: string;
  targetLabel?: string;
  title: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  eventId?: string;
}

export async function emitActivity(input: EmitActivityInput) {
  const item = await prisma.activityFeedItem.create({
    data: {
      organizerId: input.organizerId,
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId,
      actorLabel: input.actorLabel,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      title: input.title,
      summary: input.summary,
      metadata: JSON.stringify(input.metadata ?? {}),
      eventId: input.eventId,
    },
  });

  await prisma.notification.create({
    data: {
      organizerId: input.organizerId,
      eventType: input.eventType,
      title: input.title,
      body: input.summary ?? input.title,
      status: 'pending',
      metadata: JSON.stringify({ activityFeedItemId: item.id, ...input.metadata }),
    },
  });

  return item;
}

export interface WriteAuditInput {
  organizerId: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  actorLabel?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  applicationId?: string;
}

export async function writeAuditLog(input: WriteAuditInput) {
  return prisma.auditLog.create({
    data: {
      organizerId: input.organizerId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      actorId: input.actorId,
      actorLabel: input.actorLabel,
      beforeJson: input.before ? JSON.stringify(input.before) : null,
      afterJson: input.after ? JSON.stringify(input.after) : null,
      metadata: JSON.stringify(input.metadata ?? {}),
      applicationId: input.applicationId,
    },
  });
}

export function parseActivityMetadata(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}
