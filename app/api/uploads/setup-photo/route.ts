import { NextRequest, NextResponse } from 'next/server';
import { requireVendorEmail } from '@/lib/auth/resolve-vendor-email';
import { isSupabaseStorageConfigured, uploadPublicVendorPhoto } from '@/lib/storage/supabase-storage';

export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const auth = requireVendorEmail(req); if (!auth.ok) return auth.response;
  if (!isSupabaseStorageConfigured()) {
    return NextResponse.json({ ok: false, error: 'Photo storage is not configured yet' }, { status: 503 });
  }
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Photo file is required' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'Use a JPG, PNG, or WebP image under 4 MB' },
      { status: 400 }
    );
  }
  try {
    const url = await uploadPublicVendorPhoto(auth.email, file);
    return NextResponse.json({ ok: true, url }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Photo upload failed' },
      { status: 502 }
    );
  }
}
