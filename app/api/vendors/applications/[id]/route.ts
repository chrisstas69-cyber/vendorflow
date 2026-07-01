import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { resolveVendorEmail } from '@/lib/auth/resolve-vendor-email';
import {
  getVendorApplicationById,
  markVendorApplicationPaid,
  updateVendorSetupPhoto,
  uploadVendorApplicationDoc,
} from '@/lib/vendor-applications-store';
import type { DocumentType } from '@/lib/documents';

export const dynamic = 'force-dynamic';

/** GET — single vendor application */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensurePlatformSeed();
  const vendorEmail = resolveVendorEmail(req);
  const application = await getVendorApplicationById(params.id, vendorEmail);
  if (!application) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, application });
}

/** PATCH — vendor updates (docs, paid, setup photo) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensurePlatformSeed();
  const vendorEmail = resolveVendorEmail(req);
  const body = await req.json();

  if (body.uploadDocType) {
    const application = await uploadVendorApplicationDoc(
      params.id,
      vendorEmail,
      body.uploadDocType as DocumentType
    );
    if (!application) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, application });
  }

  if (body.markPaid) {
    const application = await markVendorApplicationPaid(params.id, vendorEmail);
    if (!application) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, application });
  }

  if (body.setupPhotoUrl !== undefined) {
    const application = await updateVendorSetupPhoto(
      params.id,
      vendorEmail,
      body.setupPhotoUrl as string | undefined
    );
    if (!application) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, application });
  }

  return NextResponse.json({ ok: false, error: 'No valid update' }, { status: 400 });
}
