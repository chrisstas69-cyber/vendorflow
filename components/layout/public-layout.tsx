'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  LogIn,
} from 'lucide-react';
import { RoleSwitcher } from '@/components/layout/role-switcher';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/discover', label: 'Discover' },
  { href: '/for-vendors', label: 'Vendors' },
  { href: '/for-organizers', label: 'Organizers' },
  { href: '/pricing', label: 'Pricing' },
];

function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'night';
  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-lg border vf-border vf-surface p-2 vf-text-muted hover:vf-text transition-colors"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

function AuthActions({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { session, ready, signOut } = useAuth();

  if (!ready) {
    return <div className="h-8 w-8 rounded-full vf-surface-2 animate-pulse" />;
  }

  if (!session) {
    if (mobile) {
      return (
        <Link
          href="/login"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium vf-text-muted hover:vf-surface-2 hover:vf-text"
        >
          <LogIn size={15} />
          Sign in
        </Link>
      );
    }
    return (
      <Link
        href="/login"
        className="hidden md:inline-flex items-center rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-1.5 text-xs font-semibold transition-colors shadow-sm"
      >
        Sign in
      </Link>
    );
  }

  if (mobile) {
    return (
      <button
        onClick={() => {
          onNavigate?.();
          signOut();
        }}
        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium vf-text-muted hover:vf-surface-2 hover:vf-text"
      >
        <LogOut size={15} />
        Sign out
      </button>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-1.5">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-700 text-xs font-semibold text-white"
        title={session.email}
      >
        {session.email?.[0]?.toUpperCase() ?? 'U'}
      </span>
      <button
        type="button"
        onClick={() => signOut()}
        className="rounded-lg p-2 vf-text-subtle hover:vf-text transition-colors"
        title="Sign out"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col vf-bg vf-text">
      <header className="sticky top-0 z-50 border-b vf-border glass">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-orange-600 to-amber-700 text-white text-xs font-bold shadow-sm">
              V
            </span>
            <span className="text-sm font-semibold vf-text tracking-tight hidden sm:inline">
              VendorFlow
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {NAV.map(link => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'vf-surface-2 vf-text'
                      : 'vf-text-muted hover:vf-text hover:vf-surface-2'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <Link
              href="/discover"
              className="hidden lg:flex items-center gap-2 rounded-lg border vf-border vf-surface vf-text-muted hover:vf-text hover:vf-surface-2 px-2.5 py-1.5 text-xs transition-colors w-44"
            >
              <Search size={13} />
              <span className="flex-1 text-left">Search events…</span>
            </Link>

            <ThemeToggle />

            <button
              className="relative hidden sm:block rounded-lg border vf-border vf-surface p-2 vf-text-muted hover:vf-text transition-colors"
              aria-label="Notifications"
            >
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
            </button>

            <div className="hidden sm:block">
              <RoleSwitcher variant="compact" accent="amber" />
            </div>

            <AuthActions />

            <button
              className="md:hidden rounded-lg border vf-border vf-surface p-2 vf-text-muted hover:vf-text"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={15} /> : <Menu size={15} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t vf-border vf-bg">
            <nav className="px-4 py-3 space-y-1">
              {NAV.map(link => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'vf-surface-2 vf-text'
                        : 'vf-text-muted hover:vf-surface-2 hover:vf-text'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <AuthActions mobile onNavigate={() => setMobileOpen(false)} />
              <div className="px-3 py-2">
                <RoleSwitcher variant="compact" accent="amber" />
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <footer className="mt-auto border-t vf-border vf-bg-subtle relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-orange-600 to-amber-700 text-white text-xs font-bold">
                  V
                </span>
                <span className="text-sm font-semibold vf-text">VendorFlow</span>
              </div>
              <p className="text-xs vf-text-muted leading-relaxed">
                Event vendor intelligence for NY &amp; NJ. Real booths, real crowds.
              </p>
            </div>
            <FooterCol
              title="Discover events"
              links={[
                { label: 'All events', href: '/discover' },
                { label: 'This week', href: '/discover?when=week' },
                { label: 'Car shows', href: '/discover?cat=Car+Show' },
                { label: 'Festivals', href: '/discover?cat=Festival' },
              ]}
            />
            <FooterCol
              title="For vendors"
              links={[
                { label: 'Vendor tools', href: '/for-vendors' },
                { label: 'Find events', href: '/pulse' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Sign in', href: '/login' },
              ]}
            />
            <FooterCol
              title="For organizers"
              links={[
                { label: 'Organizer hub', href: '/for-organizers' },
                { label: 'Dashboard', href: '/organizer' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Status', href: '/status' },
              ]}
            />
          </div>
          <div className="mt-8 pt-6 border-t vf-border flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] vf-text-subtle">
            <span>© 2026 VendorFlow — NY &amp; NJ events</span>
            <div className="flex items-center gap-4">
              <Link href="/discover" className="hover:vf-text">Discover</Link>
              <Link href="/for-vendors" className="hover:vf-text">Vendors</Link>
              <Link href="/for-organizers" className="hover:vf-text">Organizers</Link>
              <Link href="/pricing" className="hover:vf-text">Pricing</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-[10px] font-semibold uppercase tracking-wider vf-text-subtle mb-3">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map(l => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-xs vf-text-muted hover:vf-text transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
