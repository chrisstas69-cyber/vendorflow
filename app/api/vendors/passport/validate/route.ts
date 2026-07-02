import { NextRequest, NextResponse } from 'next/server';
import { validatePassportByEmail } from '@/lib/vendor-passport-store';
import { loadPassportFromDb } from '@/lib/vendor-passport-db';
import { validatePassport } from '@/lib/vendor-passport';
import { resolveVendorEmail } from '@/lib/auth/resolve-vendor-email';

/** GET — validation state only (session-derived identity) */
export async function GET(req: NextRequest) {
  const vendorEmail = resolveVendorEmail(req);

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
