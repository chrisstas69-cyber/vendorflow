'use client';

import { usePathname } from 'next/navigation';

const VENDOR_SURFACE_PREFIXES = [
  '/pulse',
  '/vendor',
  '/command',
  '/intelligence',
  '/calendar',
  '/journal',
  '/events',
  '/organizers',
];

/**
 * True on pages that actually consume vendor data contexts. Providers gate
 * their mount-time fetches on this so the homepage, pricing, and organizer
 * pages don't pay for 4+ vendor API calls they never use.
 */
export function useIsVendorSurface(): boolean {
  const pathname = usePathname();
  if (!pathname) return false;
  return VENDOR_SURFACE_PREFIXES.some(
    p => pathname === p || pathname.startsWith(`${p}/`)
  );
}
