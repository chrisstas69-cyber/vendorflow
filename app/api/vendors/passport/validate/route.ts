import { NextRequest, NextResponse } from 'next/server';
import { validatePassportByEmail } from '@/lib/vendor-passport-store';
import { loadPassportFromDb } from '@/lib/vendor-passport-db';
import { DEMO_VENDOR_EMAIL, validatePassport } from '@/lib/vendor-passport';

/** GET — validation state only (for matching engine / status badges) */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vendorEmail = searchParams.get('vendorEmail') ?? DEMO_VENDOR_EMAIL;

  const fromDb = await loadPassportFromDb(vendorEmail);
  const passport = fromDb ?? validatePassportByEmail(vendorEmail).passport;
  const validation = validatePassport(passport);

  return NextResponse.json({
    ok: true,
    vendorEmail,
    validation,
    summary: {
      businessName: passport.businessName,
      categories: passport.categories,
      serviceTags: passport.serviceTags,
      documentCount: passport.documents.length,
      readyForMatching: validation.readyForMatching,
    },
  });
}
