import { NextRequest, NextResponse } from 'next/server';
import {
  createPassport,
  deletePassport,
  getOrCreatePassport,
  getPassport,
  resetPassportStore,
  syncPassportFromClient,
  updatePassport,
} from '@/lib/vendor-passport-store';
import { loadPassportFromDb, persistPassportToDb } from '@/lib/vendor-passport-db';
import { DEMO_VENDOR_EMAIL, validatePassport, type VendorPassport } from '@/lib/vendor-passport';
import { resolveVendorEmail } from '@/lib/auth/resolve-vendor-email';

async function hydratePassport(vendorEmail: string): Promise<VendorPassport> {
  const fromDb = await loadPassportFromDb(vendorEmail);
  if (fromDb) {
    syncPassportFromClient(fromDb);
    return fromDb;
  }
  const mem = getOrCreatePassport(vendorEmail);
  await persistPassportToDb(mem).catch(() => {});
  return mem;
}

/** GET — read passport + validation (session-derived identity) */
export async function GET(req: NextRequest) {
  const vendorEmail = resolveVendorEmail(req);

  const passport = await hydratePassport(vendorEmail);
  const validation = validatePassport(passport);

  return NextResponse.json({ ok: true, passport, validation });
}

/** POST — create passport or sync full client payload */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const sessionEmail = resolveVendorEmail(req);

  if (body.reset) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ ok: false, error: 'Reset disabled in production' }, { status: 403 });
    }
    resetPassportStore();
    return NextResponse.json({ ok: true, message: 'Passport store reset' });
  }

  if (body.sync && body.passport) {
    // Bind synced passport to the session identity — clients can't write another vendor's passport.
    const incoming = { ...(body.passport as VendorPassport), vendorEmail: sessionEmail };
    syncPassportFromClient(incoming);
    const saved = await persistPassportToDb(incoming);
    const validation = validatePassport(saved);
    return NextResponse.json({ ok: true, passport: saved, validation });
  }

  const vendorEmail = sessionEmail;

  if (getPassport(vendorEmail)) {
    return NextResponse.json({ ok: false, error: 'Passport already exists — use PUT to update' }, { status: 409 });
  }

  try {
    const passport = createPassport({ ...body, vendorEmail });
    const saved = await persistPassportToDb(passport);
    const validation = validatePassport(saved);
    return NextResponse.json({ ok: true, passport: saved, validation }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Create failed' },
      { status: 400 }
    );
  }
}

/** PUT — partial update (session-derived identity) */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const vendorEmail = resolveVendorEmail(req);

  const { vendorEmail: _omit, ...patch } = body;
  const passport = updatePassport(vendorEmail, patch);
  const saved = await persistPassportToDb(passport);
  const validation = validatePassport(saved);

  return NextResponse.json({ ok: true, passport: saved, validation });
}

/** DELETE — remove own passport */
export async function DELETE(req: NextRequest) {
  const vendorEmail = resolveVendorEmail(req);

  if (vendorEmail === DEMO_VENDOR_EMAIL) {
    return NextResponse.json({ ok: false, error: 'Cannot delete demo passport' }, { status: 403 });
  }

  const deleted = deletePassport(vendorEmail);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: 'Passport not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message: 'Passport deleted' });
}
