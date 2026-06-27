'use client';

import { useRouter } from 'next/navigation';
import { useRole } from '@/contexts/role-context';
import type { UserRole } from '@/lib/platform-data';

const ROLES: { id: UserRole; label: string; href: string }[] = [
  { id: 'public', label: 'Public', href: '/' },
  { id: 'vendor', label: 'Vendor', href: '/pulse' },
  { id: 'organizer', label: 'Organizer', href: '/organizer' },
];

type Accent = 'amber' | 'indigo';

export function RoleSwitcher({
  variant = 'default',
  accent = 'amber',
}: {
  variant?: 'default' | 'compact';
  accent?: Accent;
}) {
  const { role, setRole } = useRole();
  const router = useRouter();

  const activeBg =
    accent === 'indigo'
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'bg-amber-400 text-gray-900 shadow-sm';

  const handleSwitch = (r: (typeof ROLES)[number]) => {
    setRole(r.id);
    router.push(r.href);
  };

  const trackClass =
    variant === 'compact'
      ? 'bg-black/5 dark:bg-white/10'
      : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700';

  return (
    <div className={`inline-flex rounded-lg p-0.5 ${trackClass}`}>
      {ROLES.map(r => (
        <button
          key={r.id}
          type="button"
          onClick={() => handleSwitch(r)}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            role === r.id
              ? activeBg
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
