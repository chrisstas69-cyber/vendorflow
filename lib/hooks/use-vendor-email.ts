'use client';

import { useAuth } from '@/contexts/auth-context';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';

export function useVendorEmail() {
  const { session, ready } = useAuth();
  const vendorEmail =
    ready && session?.role === 'vendor' ? session.email : DEMO_VENDOR_EMAIL;
  const isSignedIn = ready && session?.role === 'vendor';
  return { vendorEmail, isSignedIn, session };
}
