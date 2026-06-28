import { NextResponse } from 'next/server';
import { getPilotConfigSnapshot, getActiveOrganizerId } from '@/lib/pilot-config';
import { resolveOrganizerInboxAsync } from '@/lib/pilot-data-adapter';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Internal founder traction metrics for the Long Island pilot */
export async function GET() {
  const pilot = getPilotConfigSnapshot();
  const organizerId = getActiveOrganizerId();

  const inbox = await resolveOrganizerInboxAsync({ organizerId });
  const vendorEmails = new Set(inbox.items.map(i => i.vendorEmail));

  let activePassports = 0;
  try {
    activePassports = await prisma.vendorPassport.count({
      where: { validationState: { not: 'incomplete' } },
    });
  } catch {
    activePassports = vendorEmails.size;
  }

  let organizerCount = 1;
  try {
    const seriesOrganizers = await prisma.eventSeries.groupBy({
      by: ['organizerId'],
    });
    organizerCount = Math.max(1, seriesOrganizers.length);
  } catch {
    organizerCount = 1;
  }

  return NextResponse.json({
    ok: true,
    pilot,
    metrics: {
      organizers: organizerCount,
      vendors: vendorEmails.size,
      events: inbox.events.length,
      applications: inbox.items.length,
      activePassports,
      series: inbox.series.length,
      approvedVendors: inbox.items.filter(i => i.status === 'approved').length,
      projectedRevenueCents: inbox.seasonMetrics?.projectedRevenueCents ?? 0,
    },
    updatedAt: new Date().toISOString(),
  });
}
