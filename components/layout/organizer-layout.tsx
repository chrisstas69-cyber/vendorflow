'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Calendar, FileText, LayoutDashboard, Plus, Users } from 'lucide-react';
import { RoleSwitcher } from '@/components/layout/role-switcher';
import { PublicThemeToggle } from '@/components/public/theme-toggle';
import { useTheme } from '@/contexts/theme-context';

const NAV = [
  { href: '/organizer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/organizer/events', label: 'My Events', icon: Calendar },
  { href: '/organizer/applications', label: 'Applications', icon: FileText },
  { href: '/organizer/command', label: 'Command Center', icon: Users },
  { href: '/organizer/events/new', label: 'Create Event', icon: Plus },
];

export function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode } = useTheme();
  const dark = mode === 'night';

  const shell = dark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900';
  const sidebar = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const navActive = dark ? 'bg-indigo-950 text-indigo-300' : 'bg-indigo-50 text-indigo-700';
  const navIdle = dark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50';

  return (
    <div className={`min-h-screen flex ${shell}`}>
      <aside className={`hidden lg:flex w-56 flex-col border-r shrink-0 ${sidebar}`}>
        <div className={`p-4 border-b ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
          <Link href="/organizer" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              VF
            </div>
            <div>
              <div className="font-bold text-sm">Organizer Hub</div>
              <div className={`text-xs ${muted}`}>VendorFlow</div>
            </div>
          </Link>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/organizer' && pathname.startsWith(href));
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
          <PublicThemeToggle />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`sticky top-0 z-40 border-b px-4 py-3 flex items-center justify-between ${sidebar}`}>
          <Link href="/organizer" className="font-bold text-sm lg:hidden">Organizer Hub</Link>
          <div className="hidden lg:block text-sm font-semibold">Organizer Hub</div>
          <div className="flex items-center gap-2">
            <PublicThemeToggle compact />
            <RoleSwitcher variant="compact" accent="indigo" />
          </div>
        </header>
        <div className={`lg:hidden overflow-x-auto border-b px-2 py-2 flex gap-1 ${sidebar}`}>
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                pathname === href || pathname.startsWith(href) ? navActive : dark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className={`border-b px-4 py-2 text-xs text-center ${dark ? 'bg-indigo-950/50 text-indigo-300 border-indigo-900' : 'bg-indigo-50 text-indigo-800 border-indigo-100'}`}>
          Demo organizer — upload photos &amp; promote listings (mock)
        </div>
        <main className="flex-1 p-4 md:p-6 max-w-5xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
