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

/** GET — read passport + validation for vendorEmail (defaults to demo vendor) */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vendorEmail = searchParams.get('vendorEmail') ?? DEMO_VENDOR_EMAIL;

  const passport = await hydratePassport(vendorEmail);
  const validation = validatePassport(passport);

  return NextResponse.json({ ok: true, passport, validation });
}

/** POST — create passport or sync full client payload */
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.reset) {
    resetPassportStore();
    return NextResponse.json({ ok: true, message: 'Passport store reset' });
  }

  if (body.sync && body.passport) {
    syncPassportFromClient(body.passport as VendorPassport);
    const saved = await persistPassportToDb(body.passport as VendorPassport);
    const validation = validatePassport(saved);
    return NextResponse.json({ ok: true, passport: saved, validation });
  }

  const vendorEmail = body.vendorEmail as string;
  if (!vendorEmail) {
    return NextResponse.json({ ok: false, error: 'vendorEmail is required' }, { status: 400 });
  }

  if (getPassport(vendorEmail)) {
    return NextResponse.json({ ok: false, error: 'Passport already exists — use PUT to update' }, { status: 409 });
  }

  try {
    const passport = createPassport(body);
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

/** PUT — partial update */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const vendorEmail = (body.vendorEmail as string) ?? DEMO_VENDOR_EMAIL;

  const { vendorEmail: _omit, ...patch } = body;
  const passport = updatePassport(vendorEmail, patch);
  const saved = await persistPassportToDb(passport);
  const validation = validatePassport(saved);

  return NextResponse.json({ ok: true, passport: saved, validation });
}

/** DELETE — remove passport */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vendorEmail = searchParams.get('vendorEmail') ?? DEMO_VENDOR_EMAIL;

  if (vendorEmail === DEMO_VENDOR_EMAIL) {
    return NextResponse.json({ ok: false, error: 'Cannot delete demo passport' }, { status: 403 });
  }

  const deleted = deletePassport(vendorEmail);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: 'Passport not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message: 'Passport deleted' });
}
