'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Shield,
  Command,
  Calendar,
  DollarSign,
  IdCard,
  MessageSquare,
} from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { RoleSwitcher } from '@/components/layout/role-switcher';
import { AuthNav } from '@/components/layout/auth-nav';
import { AuthNudgeBanner } from '@/components/layout/auth-nudge-banner';
import { PublicThemeToggle } from '@/components/public/theme-toggle';
import { VendorPlanBadge } from '@/components/vendor/vendor-plan-badge';
import { useVendorEmail } from '@/lib/hooks/use-vendor-email';

const NAV = [
  { href: '/pulse', icon: Activity, label: 'Find Events' },
  { href: '/vendor', icon: IdCard, label: 'Passport' },
  { href: '/vendor/assistant', icon: MessageSquare, label: 'Assistant' },
  { href: '/command', icon: Command, label: 'Command Center' },
  { href: '/intelligence', icon: Shield, label: 'Intel' },
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/journal', icon: DollarSign, label: 'Journal' },
];

export function AppLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const { mode } = useTheme();
  const { isSignedIn } = useVendorEmail();
  const dark = mode === 'night';

  const shell = dark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900';
  const sidebar = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const navActive = dark ? 'bg-amber-950/60 text-amber-300' : 'bg-amber-50 text-amber-800';
  const navIdle = dark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50';

  return (
    <div className={`min-h-screen flex ${shell}`}>
      <aside className={`hidden lg:flex w-56 flex-col border-r shrink-0 ${sidebar}`}>
        <div className={`p-4 border-b ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
          <Link href="/pulse" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-amber-400 text-gray-900 flex items-center justify-center text-xs font-bold">
              VF
            </div>
            <div>
              <div className="font-bold text-sm">Vendor Hub</div>
              <div className={`text-xs ${muted}`}>VendorFlow</div>
            </div>
          </Link>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? navActive : navIdle
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className={`p-3 border-t space-y-2 ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
          <VendorPlanBadge />
          <PublicThemeToggle />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`sticky top-0 z-40 border-b px-4 py-3 flex items-center justify-between ${sidebar}`}
        >
          <Link href="/pulse" className="font-bold text-sm lg:hidden">
            Vendor Hub
          </Link>
          <div className="hidden lg:block text-sm font-semibold">Vendor Hub</div>
          <div className="flex items-center gap-2">
            <PublicThemeToggle compact />
            <AuthNav accent="amber" compact />
            <RoleSwitcher variant="compact" accent="amber" />
          </div>
        </header>

        <AuthNudgeBanner audience="vendor" />

        <div className={`lg:hidden overflow-x-auto border-b px-2 py-2 flex gap-1 ${sidebar}`}>
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                pathname === href
                  ? navActive
                  : dark
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div
          className={`border-b px-4 py-1.5 text-xs text-center ${
            dark
              ? 'bg-amber-950/30 text-amber-300 border-amber-900/50'
              : 'bg-amber-50 text-amber-800 border-amber-100'
          }`}
        >
          {isSignedIn
            ? 'Signed in — your applications and journal sync to your account'
            : 'Demo mode — sign in to save your data across devices'}
        </div>

        {title && (
          <div className={`px-4 py-3 border-b ${dark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <h1 className="text-lg font-bold">{title}</h1>
          </div>
        )}

        <main className="flex-1 min-h-0">{children}</main>
      </div>
    </div>
  );
}
