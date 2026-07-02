import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { listOpsJurisdictions, searchOpsOrganizations } from '@/lib/ops-contacts-store';
import type { ContactPurposeTag, OrgType, OutreachStatus } from '@/lib/ops-contacts-schema';
import {
  CONTACT_PURPOSE_TAGS,
  ORG_TYPES,
  OUTREACH_STATUSES,
  resolveViewerRole,
} from '@/lib/ops-contacts-schema';
import { canUseInternalViewer } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

/** GET — search operational contact database (private) */
export async function GET(req: NextRequest) {
  try {
    await ensurePlatformSeed();

    const { searchParams } = new URL(req.url);
    const requested = resolveViewerRole(searchParams.get('viewerRole'));
    const viewer = requested === 'internal' && !canUseInternalViewer(req) ? 'organizer' : requested;

    const params = {
      q: searchParams.get('q') ?? undefined,
      county: searchParams.get('county') ?? undefined,
      town: searchParams.get('town') ?? undefined,
      orgType: (searchParams.get('orgType') as OrgType) || undefined,
      department: searchParams.get('department') ?? undefined,
      purposeTag: (searchParams.get('purposeTag') as ContactPurposeTag) || undefined,
      outreachStatus: (searchParams.get('outreachStatus') as OutreachStatus) || undefined,
      internalOnly:
        searchParams.get('internalOnly') === 'true'
          ? true
          : searchParams.get('internalOnly') === 'false'
            ? false
            : undefined,
    };

    const { organizations, dataSource } = await searchOpsOrganizations(params, viewer);
    const jurisdictions = await listOpsJurisdictions();

    return NextResponse.json({
      ok: true,
      dataSource,
      viewerRole: viewer,
      organizations,
      jurisdictions,
      filters: {
        orgTypes: ORG_TYPES,
        purposeTags: CONTACT_PURPOSE_TAGS,
        outreachStatuses: OUTREACH_STATUSES,
      },
    meta: {
      total: organizations.length,
      private: true,
      chamberCount: organizations.filter(o => o.type === 'chamber').length,
      manuallyEditedCount: organizations.filter(o => o.import?.manuallyEdited).length,
      withDedupeKey: organizations.filter(o => o.import?.dedupeKey).length,
      description: 'Operational contact intelligence — internal/premium layer, not a public directory',
    },
    });
  } catch (err) {
    console.error('[ops/contacts]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed to load contacts' },
      { status: 500 }
    );
  }
}
