import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { buildHealthSnapshot } from '@/lib/health-snapshot';
import { ensurePlatformSeed } from '@/lib/platform-seed';

export const dynamic = 'force-dynamic';

/** GET — ops health snapshot (no secrets). ?ping=sentry sends a test event. */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();

  const ping = req.nextUrl.searchParams.get('ping');
  let sentryPing: { sent: boolean; detail: string } | undefined;

  if (ping === 'sentry') {
    const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) {
      sentryPing = { sent: false, detail: 'SENTRY_DSN not set' };
    } else {
      try {
        const eventId = Sentry.captureMessage('VendorFlow health-check ping', {
          level: 'info',
          tags: { source: 'health-api' },
        });
        await Sentry.flush(2000);
        sentryPing = {
          sent: Boolean(eventId),
          detail: eventId
            ? `Test event sent (${eventId}) — check Sentry Issues in ~30s`
            : 'captureMessage returned no event id',
        };
      } catch (e) {
        sentryPing = {
          sent: false,
          detail: e instanceof Error ? e.message : 'Sentry ping failed',
        };
      }
    }
  }

  const snapshot = await buildHealthSnapshot();
  return NextResponse.json(
    { ...snapshot, sentryPing },
    { status: snapshot.ok ? 200 : 503 }
  );
}
