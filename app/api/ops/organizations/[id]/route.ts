import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { getOpsOrganization, logOpsOutreach, updateOpsOrganization } from '@/lib/ops-contacts-store';
import { resolveViewerRole } from '@/lib/ops-contacts-schema';

export const dynamic = 'force-dynamic';

/** GET — organization detail with contacts & outreach log */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensurePlatformSeed();

  const viewer = resolveViewerRole(new URL(req.url).searchParams.get('viewerRole'));
  const org = await getOpsOrganization(params.id, viewer);

  if (!org) {
    return NextResponse.json({ ok: false, error: 'Organization not found or access denied' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, organization: org, viewerRole: viewer });
}

/** PATCH — update outreach status, notes (internal) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensurePlatformSeed();

  const viewer = resolveViewerRole(new URL(req.url).searchParams.get('viewerRole'));
  if (viewer !== 'internal') {
    return NextResponse.json({ ok: false, error: 'Internal access required' }, { status: 403 });
  }

  const body = await req.json();
  const org = await updateOpsOrganization(params.id, {
    outreachStatus: body.outreachStatus,
    notes: body.notes,
    internalOnly: body.internalOnly,
    defaultVisibility: body.defaultVisibility,
  });

  if (!org) {
    return NextResponse.json({ ok: false, error: 'Organization not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, organization: org });
}

/** POST — log outreach activity */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensurePlatformSeed();

  const body = await req.json();
  const { activityType, summary, contactId, actorLabel } = body as {
    activityType?: string;
    summary?: string;
    contactId?: string;
    actorLabel?: string;
  };

  if (!activityType || !summary) {
    return NextResponse.json({ ok: false, error: 'activityType and summary required' }, { status: 400 });
  }

  const activity = await logOpsOutreach({
    organizationId: params.id,
    contactId,
    activityType,
    summary,
    actorLabel: actorLabel ?? 'Organizer',
  });

  return NextResponse.json({ ok: true, activity });
}
