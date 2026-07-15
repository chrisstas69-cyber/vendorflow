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
  MapPin,
  Settings,
  Sparkles,
  Users,
  BookUser,
} from 'lucide-react';
import { RoleSwitcher } from '@/components/layout/role-switcher';
import { AuthNav } from '@/components/layout/auth-nav';
import { AuthNudgeBanner } from '@/components/layout/auth-nudge-banner';
import { PublicThemeToggle } from '@/components/public/theme-toggle';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { FoundersEditionBanner } from '@/components/founders/founders-banner';
import { PilotModeBanner } from '@/components/organizer/pilot-mode-banner';
import { OrganizerPlanBadge } from '@/components/organizer/plan-badge';

/** Workflow-first navigation — matches organizer journey */
const NAV = [
  { href: '/organizer', label: 'Dashboard', icon: LayoutGrid, match: (p: string) => p === '/organizer' },
  { href: '/organizer/events', label: 'Events', icon: Calendar, match: (p: string) => p.startsWith('/organizer/events') },
  { href: '/organizer/applications', label: 'Applications', icon: FileText, match: (p: string) => p.startsWith('/organizer/applications') },
  { href: '/organizer/vendors', label: 'Vendors', icon: Users, match: (p: string) => p.startsWith('/organizer/vendors') },
  { href: '/organizer/contacts', label: 'Contacts', icon: BookUser, match: (p: string) => p.startsWith('/organizer/contacts') },
  { href: '/organizer/booths', label: 'Booths', icon: Map, match: (p: string) => p.startsWith('/organizer/booths') },
  { href: '/organizer/invoicing', label: 'Booth fees', icon: CreditCard, match: (p: string) => p.startsWith('/organizer/invoicing') },
  { href: '/organizer/compliance', label: 'Compliance', icon: MapPin, match: (p: string) => p.startsWith('/organizer/compliance') },
  { href: '/organizer/intel', label: 'Insights', icon: Sparkles, match: (p: string) => p.startsWith('/organizer/intel') },
  { href: '/organizer/settings', label: 'Settings', icon: Settings, match: (p: string) => p.startsWith('/organizer/settings') || p.startsWith('/organizer/founder') || p.startsWith('/organizer/assistant') },
];

const NAV_LABEL: Record<string, string> = Object.fromEntries(NAV.map(n => [n.href, n.label]));

export function OrganizerLayout({
  children,
  showBanners = true,
}: {
  children: React.ReactNode;
  showBanners?: boolean;
}) {
  const pathname = usePathname();
  const t = useOrganizerTheme();
  const pageLabel =
    NAV.find(n => n.match(pathname))?.label ??
    (pathname.startsWith('/organizer/founder') ? 'Founder Metrics' : 'Organizer');

  return (
    <div className={`min-h-screen flex ${t.shell}`}>
      <aside className={`hidden lg:flex w-56 flex-col shrink-0 ${t.sidebar} border-r`}>
        <div className={`p-4 border-b ${t.divider}`}>
          <Link href="/organizer" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-600 to-amber-700 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              V
            </div>
            <div>
              <div className="font-bold text-sm vf-text">Organizer Hub</div>
              <div className={`text-xs ${t.muted}`}>VendorFlow OS</div>
            </div>
          </Link>
        </div>
        <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
          <OrganizerPlanBadge />
          <PublicThemeToggle />
          <RoleSwitcher variant="compact" accent="teal" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`sticky top-0 z-40 px-4 py-3 flex items-center justify-between ${t.sidebar} border-b ${t.divider}`}
        >
          <div>
            <Link href="/organizer" className={`font-bold text-sm lg:hidden ${t.heading}`}>
              {pageLabel}
            </Link>
            <div className={`hidden lg:block text-sm font-semibold ${t.heading}`}>{pageLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <PublicThemeToggle compact />
            <AuthNav accent="teal" compact />
            <RoleSwitcher variant="compact" accent="teal" />
          </div>
        </header>

        <AuthNudgeBanner audience="organizer" />

        <div className={`lg:hidden overflow-x-auto border-b px-2 py-2 flex gap-1 ${t.sidebar} ${t.divider}`}>
          {NAV.map(({ href, label, match }) => (
            <Link
              key={href}
              href={href}
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                match(pathname) ? t.navActive : t.navIdle
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {showBanners && (
          <div className="px-4 pt-4 space-y-2 max-w-[1600px] w-full mx-auto">
            <PilotModeBanner />
            <FoundersEditionBanner compact />
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export { NAV_LABEL };
