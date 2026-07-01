import { prisma } from '@/lib/prisma';
import { ensurePilotDbSeed } from '@/lib/pilot-db-seed';
import {
  dbRowToVendorApplication,
  type VendorApplicationRow,
} from '@/lib/vendor-application-map';
import type { Application } from '@/lib/mock-data';
import type { DocumentType } from '@/lib/documents';
import { mockPlatformEvents } from '@/lib/platform-data';
import { PILOT_ORGANIZER } from '@/lib/pilot-config';

function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export async function listVendorApplicationsFromDb(vendorEmail: string): Promise<Application[]> {
  await ensurePilotDbSeed();
  const rows = await prisma.vendorApplication.findMany({
    where: { vendorEmail: vendorEmail.toLowerCase().trim() },
    include: { boothAssignment: true },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(r => dbRowToVendorApplication(r as VendorApplicationRow));
}

export async function getVendorApplicationById(
  id: string,
  vendorEmail: string
): Promise<Application | null> {
  await ensurePilotDbSeed();
  const row = await prisma.vendorApplication.findFirst({
    where: { id, vendorEmail: vendorEmail.toLowerCase().trim() },
    include: { boothAssignment: true },
  });
  if (!row) return null;
  return dbRowToVendorApplication(row as VendorApplicationRow);
}

export async function updateVendorApplicationDocs(
  id: string,
  vendorEmail: string,
  uploadedDocTypes: string[]
) {
  await ensurePilotDbSeed();
  const existing = await prisma.vendorApplication.findFirst({
    where: { id, vendorEmail: vendorEmail.toLowerCase().trim() },
  });
  if (!existing) return null;

  const updated = await prisma.vendorApplication.update({
    where: { id },
    data: { uploadedDocTypes: JSON.stringify(uploadedDocTypes) },
    include: { boothAssignment: true },
  });
  return dbRowToVendorApplication(updated as VendorApplicationRow);
}

export async function markVendorApplicationPaid(id: string, vendorEmail: string) {
  await ensurePilotDbSeed();
  const existing = await prisma.vendorApplication.findFirst({
    where: { id, vendorEmail: vendorEmail.toLowerCase().trim() },
  });
  if (!existing) return null;

  const updated = await prisma.vendorApplication.update({
    where: { id },
    data: { paymentStatus: 'paid' },
    include: { boothAssignment: true },
  });
  return dbRowToVendorApplication(updated as VendorApplicationRow);
}

export async function updateVendorSetupPhoto(
  id: string,
  vendorEmail: string,
  setupPhotoUrl: string | undefined
) {
  await ensurePilotDbSeed();
  const existing = await prisma.vendorApplication.findFirst({
    where: { id, vendorEmail: vendorEmail.toLowerCase().trim() },
  });
  if (!existing) return null;

  const updated = await prisma.vendorApplication.update({
    where: { id },
    data: { setupPhotoUrl: setupPhotoUrl ?? null },
    include: { boothAssignment: true },
  });
  return dbRowToVendorApplication(updated as VendorApplicationRow);
}

export async function uploadVendorApplicationDoc(
  id: string,
  vendorEmail: string,
  docType: DocumentType
) {
  await ensurePilotDbSeed();
  const existing = await prisma.vendorApplication.findFirst({
    where: { id, vendorEmail: vendorEmail.toLowerCase().trim() },
  });
  if (!existing) return null;

  const uploaded = parseJsonArray(existing.uploadedDocTypes);
  if (!uploaded.includes(docType)) uploaded.push(docType);

  let contractStatus = existing.contractStatus;
  if (docType === 'ce200' && contractStatus === 'sent') {
    contractStatus = 'signed';
  }

  const updated = await prisma.vendorApplication.update({
    where: { id },
    data: {
      uploadedDocTypes: JSON.stringify(uploaded),
      contractStatus,
    },
    include: { boothAssignment: true },
  });
  return dbRowToVendorApplication(updated as VendorApplicationRow);
}

export async function sendCe200FromDb(applicationId: string, actorLabel = 'Organizer') {
  await ensurePilotDbSeed();
  const app = await prisma.vendorApplication.findUnique({
    where: { id: applicationId },
    include: { boothAssignment: true, organizer: true },
  });
  if (!app) return { ok: false as const, error: 'Application not found' };

  const updated = await prisma.vendorApplication.update({
    where: { id: applicationId },
    data: {
      contractStatus: 'sent',
      ce200SentAt: new Date(),
    },
    include: { boothAssignment: true },
  });

  const { queueEmail } = await import('@/lib/email-queue');
  await queueEmail({
    templateId: 'ce200_sent',
    toEmail: app.vendorEmail,
    applicationId: app.id,
    organizerId: app.organizerId,
    vars: {
      vendorName: app.vendorName,
      eventName: app.eventName,
      organizerName: app.organizer?.organization ?? PILOT_ORGANIZER.organization,
    },
  });

  const { emitActivity } = await import('@/lib/workflow/emit-activity');
  await emitActivity({
    organizerId: app.organizerId,
    eventType: 'contract.sent',
    actorType: 'organizer',
    actorLabel,
    targetType: 'application',
    targetId: app.id,
    targetLabel: app.vendorName,
    title: `CE200 sent to ${app.vendorName}`,
    eventId: app.eventId,
  });

  return { ok: true as const, application: dbRowToVendorApplication(updated as VendorApplicationRow) };
}

export async function getOrganizerPublicProfile(slug: string) {
  await ensurePilotDbSeed();
  const org = await prisma.organizerAccount.findUnique({ where: { slug } });
  if (!org) return null;

  const events = mockPlatformEvents.filter(e => e.organizerId === org.id);
  return {
    id: org.id,
    slug: org.slug,
    name: org.organization,
    email: org.email,
    region: org.region,
    verified: org.verified,
    planId: org.planId,
    events,
  };
}

export async function ensurePassportForEmail(email: string) {
  const normalized = email.toLowerCase().trim();
  return prisma.vendorPassport.upsert({
    where: { vendorEmail: normalized },
    create: { vendorEmail: normalized, businessName: '', contactName: '' },
    update: {},
  });
}
