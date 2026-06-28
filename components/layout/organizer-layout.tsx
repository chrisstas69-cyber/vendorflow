'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  CreditCard,
  FileText,
  LayoutGrid,
  Map,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { RoleSwitcher } from '@/components/layout/role-switcher';
import { PublicThemeToggle } from '@/components/public/theme-toggle';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { FoundersEditionBanner } from '@/components/founders/founders-banner';

const NAV = [
  { href: '/organizer', label: 'Seasons', icon: LayoutGrid, match: (p: string) => p === '/organizer' },
  { href: '/organizer/events', label: 'Events', icon: Calendar, match: (p: string) => p.startsWith('/organizer/events') },
  { href: '/organizer/applications', label: 'Applications', icon: FileText, match: (p: string) => p.startsWith('/organizer/applications') },
  { href: '/organizer/booths', label: 'Booths & Maps', icon: Map, match: (p: string) => p.startsWith('/organizer/booths') },
  { href: '/organizer/invoicing', label: 'Payments', icon: CreditCard, match: (p: string) => p.startsWith('/organizer/invoicing') },
  { href: '/organizer/intel', label: 'Intel', icon: Sparkles, match: (p: string) => p.startsWith('/organizer/intel') },
  { href: '/organizer/assistant', label: 'Assistant', icon: MessageSquare, match: (p: string) => p.startsWith('/organizer/assistant') },
  { href: '/organizer/founder', label: 'Founder Metrics', icon: BarChart3, match: (p: string) => p.startsWith('/organizer/founder') },
];

export function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useOrganizerTheme();

  return (
    <div className={`min-h-screen flex ${t.shell}`}>
      <aside className={`hidden lg:flex w-60 flex-col border-r shrink-0 ${t.sidebar}`}>
        <div className={`p-4 border-b ${t.divider}`}>
          <Link href="/organizer" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
              VF
            </div>
            <div>
              <div className="font-bold text-sm">Organizer Hub</div>
              <div className={`text-xs ${t.muted}`}>VendorFlow OS</div>
            </div>
          </Link>
        </div>
        <nav className="p-3 space-y-0.5 flex-1">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? t.navActive : t.navIdle
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className={`p-3 border-t space-y-2 ${t.divider}`}>
          <PublicThemeToggle />
          <RoleSwitcher variant="compact" accent="teal" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`sticky top-0 z-40 border-b px-4 py-3 flex items-center justify-between ${t.sidebar}`}>
          <Link href="/organizer" className={`font-bold text-sm lg:hidden ${t.heading}`}>
            Organizer Hub
          </Link>
          <div className={`hidden lg:block text-sm font-semibold ${t.heading}`}>Organizer Hub</div>
          <div className="flex items-center gap-2">
            <PublicThemeToggle compact />
            <RoleSwitcher variant="compact" accent="teal" />
          </div>
        </header>

        <div className={`lg:hidden overflow-x-auto border-b px-2 py-2 flex gap-1 ${t.sidebar}`}>
          {NAV.slice(0, 6).map(({ href, label, match }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                match(pathname) ? t.navActive : t.navIdle
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="px-4 pt-4">
          <FoundersEditionBanner compact />
        </div>

        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
