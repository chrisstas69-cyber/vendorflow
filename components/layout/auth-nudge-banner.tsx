'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useVendorEmail } from '@/lib/hooks/use-vendor-email';

export function AuthNudgeBanner({ audience }: { audience: 'vendor' | 'organizer' }) {
  const { session, ready } = useAuth();
  const { isSignedIn } = useVendorEmail();

  if (!ready) return null;
  if (audience === 'vendor' && isSignedIn) return null;
  if (audience === 'organizer' && session?.role === 'organizer') return null;

  return (
    <div className="border-b px-4 py-2 text-xs text-center bg-amber-50 text-amber-900 border-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/50">
      {audience === 'vendor' ? (
        <>
          Sign in to save applications, journal, and passport to your account.{' '}
          <Link href="/login" className="font-semibold underline">
            Sign in
          </Link>
        </>
      ) : (
        <>
          Organizer sign-in keeps your inbox and booth maps in sync.{' '}
          <Link href="/login" className="font-semibold underline">
            Sign in
          </Link>
        </>
      )}
    </div>
  );
}
