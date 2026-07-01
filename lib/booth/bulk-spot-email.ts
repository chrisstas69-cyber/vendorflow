import type { BoothSpace } from '@/lib/booth/street-fair-schema';
import { buildSpotAssignmentEmail } from '@/components/organizer/street-fair-preview';

export function buildBulkSpotAssignmentEmail(
  booths: BoothSpace[],
  eventLabel?: string
): string {
  const withEmail = booths.filter(b => b.vendorEmail && b.vendorName);
  if (!withEmail.length) return '';

  const bcc = withEmail.map(b => encodeURIComponent(b.vendorEmail!)).join(',');
  const subject = encodeURIComponent(
    `Booth assignments${eventLabel ? ` — ${eventLabel}` : ''}`
  );
  const lines = withEmail.map(
    b =>
      `• ${b.vendorName} (${b.vendorEmail}) — Spot #${b.label}, ${b.streetName}, ${b.blockLabel}`
  );
  const body = encodeURIComponent(
    `Vendor booth assignments for ${eventLabel ?? 'the event'}:\n\n` +
      lines.join('\n') +
      `\n\nVendors: see your individual spot details. Arrive early for setup.\n\n— Organizer`
  );

  if (withEmail.length === 1) {
    return buildSpotAssignmentEmail(withEmail[0], eventLabel);
  }

  return `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
}
