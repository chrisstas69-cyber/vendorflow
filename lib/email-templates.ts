export type EmailTemplateId =
  | 'application_received'
  | 'application_approved'
  | 'application_rejected'
  | 'booth_assigned'
  | 'ce200_sent'
  | 'info_requested';

export interface EmailTemplateVars {
  vendorName?: string;
  eventName?: string;
  organizerName?: string;
  boothLabel?: string;
  message?: string;
  appUrl?: string;
}

export function renderEmailTemplate(
  templateId: EmailTemplateId,
  vars: EmailTemplateVars
): { subject: string; bodyHtml: string } {
  const name = vars.vendorName ?? 'Vendor';
  const event = vars.eventName ?? 'your event';
  const org = vars.organizerName ?? 'the organizer';
  const appUrl = vars.appUrl ?? 'https://vendorflow-mu.vercel.app/command';

  switch (templateId) {
    case 'application_received':
      return {
        subject: `Application received — ${event}`,
        bodyHtml: `<p>Hi ${name},</p><p>We received your application for <strong>${event}</strong>. ${org} will review it shortly.</p><p><a href="${appUrl}">Track your application</a></p>`,
      };
    case 'application_approved':
      return {
        subject: `Approved — ${event}`,
        bodyHtml: `<p>Hi ${name},</p><p>Great news — you're approved for <strong>${event}</strong>. Complete any remaining paperwork in VendorFlow.</p><p><a href="${appUrl}">Open Command Center</a></p>`,
      };
    case 'application_rejected':
      return {
        subject: `Update on your application — ${event}`,
        bodyHtml: `<p>Hi ${name},</p><p>Thank you for applying to <strong>${event}</strong>. Unfortunately we can't offer a spot this time.</p>`,
      };
    case 'booth_assigned':
      return {
        subject: `Booth assigned — ${event}`,
        bodyHtml: `<p>Hi ${name},</p><p>Your booth for <strong>${event}</strong> is <strong>${vars.boothLabel ?? 'assigned'}</strong>.</p><p><a href="${appUrl}">View details</a></p>`,
      };
    case 'ce200_sent':
      return {
        subject: `CE200 contract — ${event}`,
        bodyHtml: `<p>Hi ${name},</p><p>${org} sent your CE200 contract for <strong>${event}</strong>. Please review, sign, and upload in VendorFlow.</p><p><a href="${appUrl}">Upload signed CE200</a></p>`,
      };
    case 'info_requested':
      return {
        subject: `More info needed — ${event}`,
        bodyHtml: `<p>Hi ${name},</p><p>${org} needs more information for your <strong>${event}</strong> application.${vars.message ? ` ${vars.message}` : ''}</p><p><a href="${appUrl}">Respond in Command Center</a></p>`,
      };
    default:
      return { subject: 'VendorFlow update', bodyHtml: '<p>VendorFlow notification</p>' };
  }
}
