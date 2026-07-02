'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Sparkles, DollarSign } from 'lucide-react';
import { RoleSwitcher } from '@/components/layout/role-switcher';
import { AuthNav } from '@/components/layout/auth-nav';
import { PublicThemeToggle } from '@/components/public/theme-toggle';
import { useTheme } from '@/contexts/theme-context';

const NAV = [
  { href: '/', label: 'Home', icon: Sparkles },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/pricing', label: 'Pricing', icon: DollarSign },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode } = useTheme();
  const shellClass = mode === 'night' ? 'public-dark' : 'public-light';

  return (
    <div className={`public-shell ${shellClass}`}>
      <header
        className="sticky top-0 z-50 backdrop-blur border-b"
        style={{ background: 'var(--pub-header)', borderColor: 'var(--pub-border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-amber-400 flex items-center justify-center font-bold text-sm text-gray-900">
              VF
            </div>
            <span className="font-bold public-heading hidden sm:inline">VendorFlow</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'public-nav-link-active'
                    : 'public-muted hover:opacity-80'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <PublicThemeToggle compact />
            <AuthNav accent="amber" compact />
            <RoleSwitcher variant="compact" accent="amber" />
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer
        className="border-t mt-16"
        style={{ borderColor: 'var(--pub-border)', background: 'var(--pub-footer)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-8 text-sm public-muted flex flex-col sm:flex-row justify-between gap-4">
          <span>© 2026 VendorFlow — NY &amp; NJ events</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/discover" className="hover:opacity-80">Discover events</Link>
            <Link href="/for-vendors" className="hover:opacity-80">For vendors</Link>
            <Link href="/for-organizers" className="hover:opacity-80">For organizers</Link>
            <Link href="/pricing" className="hover:opacity-80">Pricing</Link>
            <Link href="/status" className="hover:opacity-80">Status</Link>
            <Link href="/login" className="hover:opacity-80">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
