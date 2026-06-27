import type { UserRole } from '@/lib/platform-data';

export const ROLE_HOME: Record<UserRole, string> = {
  public: '/',
  vendor: '/pulse',
  organizer: '/organizer',
};

const VENDOR_PREFIXES = ['/pulse', '/command', '/intelligence', '/calendar', '/journal', '/vendor'];

/** Derive active role from the current URL — source of truth for tab highlighting. */
export function roleFromPathname(pathname: string): UserRole {
  if (pathname === '/organizer' || pathname.startsWith('/organizer/')) {
    return 'organizer';
  }
  if (VENDOR_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    return 'vendor';
  }
  return 'public';
}
