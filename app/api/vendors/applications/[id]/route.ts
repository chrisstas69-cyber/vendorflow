import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { requireVendorEmail } from '@/lib/auth/resolve-vendor-email';
import {
  getVendorApplicationById,
  markVendorApplicationPaid,
  updateVendorSetupPhoto,
  uploadVendorApplicationDoc,
} from '@/lib/vendor-applications-store';
import type { DocumentType } from '@/lib/documents';
import { isAllowedImageReference } from '@/lib/storage/image-reference';

export const dynamic = 'force-dynamic';

/** GET — single vendor application */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensurePlatformSeed();
  const { id } = await params;
  const auth = requireVendorEmail(req); if (!auth.ok) return auth.response;
  const vendorEmail = auth.email;
  const application = await getVendorApplicationById(id, vendorEmail);
  if (!application) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, application });
}

/** PATCH — vendor updates (docs, paid, setup photo) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensurePlatformSeed();
  const { id } = await params;
  const auth = requireVendorEmail(req); if (!auth.ok) return auth.response;
  const vendorEmail = auth.email;
  const body = await req.json();

  if (body.uploadDocType) {
    const application = await uploadVendorApplicationDoc(
      id,
      vendorEmail,
      body.uploadDocType as DocumentType
    );
    if (!application) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, application });
  }

  if (body.markPaid) {
    const application = await markVendorApplicationPaid(id, vendorEmail);
    if (!application) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, application });
  }

  if (body.setupPhotoUrl !== undefined) {
    if (!isAllowedImageReference(body.setupPhotoUrl)) {
      return NextResponse.json({ ok: false, error: 'Invalid photo URL' }, { status: 400 });
    }
    const application = await updateVendorSetupPhoto(
      id,
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
