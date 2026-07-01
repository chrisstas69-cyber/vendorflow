import { prisma } from '@/lib/prisma';
import { renderEmailTemplate, type EmailTemplateId, type EmailTemplateVars } from '@/lib/email-templates';

export async function queueEmail(input: {
  templateId: EmailTemplateId;
  toEmail: string;
  vars?: EmailTemplateVars;
  applicationId?: string;
  organizerId?: string;
  metadata?: Record<string, unknown>;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vendorflow-mu.vercel.app';
  const { subject, bodyHtml } = renderEmailTemplate(input.templateId, {
    ...input.vars,
    appUrl: `${appUrl.replace(/\/$/, '')}/command`,
  });

  const row = await prisma.queuedEmail.create({
    data: {
      templateId: input.templateId,
      toEmail: input.toEmail.toLowerCase().trim(),
      subject,
      bodyHtml,
      applicationId: input.applicationId,
      organizerId: input.organizerId,
      metadata: JSON.stringify(input.metadata ?? {}),
      status: 'pending',
    },
  });

  await trySendQueuedEmail(row.id).catch(() => {});

  return row;
}

export async function trySendQueuedEmail(id: string) {
  const row = await prisma.queuedEmail.findUnique({ where: { id } });
  if (!row || row.status !== 'pending') return row;

  if (!process.env.RESEND_API_KEY) {
    return row;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? 'VendorFlow <onboarding@resend.dev>',
        to: row.toEmail,
        subject: row.subject,
        html: row.bodyHtml,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}`);
    return prisma.queuedEmail.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    });
  } catch (err) {
    return prisma.queuedEmail.update({
      where: { id },
      data: {
        status: 'failed',
        metadata: JSON.stringify({ error: String(err) }),
      },
    });
  }
}

export async function listQueuedEmails(filters?: {
  applicationId?: string;
  status?: string;
  limit?: number;
}) {
  return prisma.queuedEmail.findMany({
    where: {
      ...(filters?.applicationId ? { applicationId: filters.applicationId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit ?? 50,
  });
}
