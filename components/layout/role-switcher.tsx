'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from '@/contexts/role-context';
import { roleFromPathname, ROLE_HOME } from '@/lib/role-routes';
import type { UserRole } from '@/lib/platform-data';

const ROLES: { id: UserRole; label: string }[] = [
  { id: 'public', label: 'Public' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'organizer', label: 'Organizer' },
];

type Accent = 'amber' | 'indigo';

export function RoleSwitcher({
  variant = 'default',
  accent = 'amber',
}: {
  variant?: 'default' | 'compact';
  accent?: Accent;
}) {
  const pathname = usePathname();
  const { setRole } = useRole();
  const activeRole = roleFromPathname(pathname);

  const activeBg =
    accent === 'indigo'
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'bg-amber-400 text-gray-900 shadow-sm';

  const trackClass =
    variant === 'compact'
      ? 'bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10'
      : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700';

  return (
    <nav
      className={`inline-flex rounded-lg p-0.5 ${trackClass}`}
      aria-label="Switch experience"
    >
      {ROLES.map(r => {
        const href = ROLE_HOME[r.id];
        const isActive = activeRole === r.id;

        return (
          <Link
            key={r.id}
            href={href}
            prefetch
            onClick={() => setRole(r.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              isActive
                ? activeBg
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {r.label}
          </Link>
        );
      })}
    </nav>
  );
}
