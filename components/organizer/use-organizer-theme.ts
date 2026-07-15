'use client';

import { useTheme } from '@/contexts/theme-context';

/** Organizer hub tokens — aligned with VendorFlow vf-* palette + teal accent */
export function useOrganizerTheme() {
  const { mode } = useTheme();
  const dark = mode === 'night';

  return {
    dark,
    accent: 'teal',
    shell: 'vf-bg vf-text',
    sidebar: dark
      ? 'vf-surface border-[var(--vf-border)]'
      : 'vf-surface border-[var(--vf-border)]',
    card: 'vf-surface border-[var(--vf-border)]',
    surface: dark
      ? 'vf-surface shadow-sm ring-1 ring-white/10'
      : 'vf-surface shadow-sm ring-1 ring-black/5',
    cardInset: dark ? 'vf-surface-2 border-[var(--vf-border)]' : 'vf-bg-subtle border-[var(--vf-border)]',
    muted: 'vf-text-muted',
    heading: 'vf-text',
    label: dark ? 'text-stone-300' : 'vf-text-subtle',
    pageTitle: 'text-2xl md:text-[1.75rem] font-bold tracking-tight',
    sectionTitle: 'text-lg font-semibold',
    navActive: dark
      ? 'bg-emerald-950/50 text-emerald-300'
      : 'bg-orange-50 text-orange-800',
    navIdle: dark
      ? 'vf-text-muted hover:vf-surface-2 hover:vf-text'
      : 'vf-text-muted hover:vf-surface-2 hover:vf-text',
    btnPrimary: 'bg-orange-600 hover:bg-orange-700 text-white font-semibold',
    btnSecondary: dark
      ? 'border-[var(--vf-border)] vf-surface-2 hover:vf-surface-3 vf-text'
      : 'border-[var(--vf-border)] vf-surface hover:vf-surface-2 vf-text',
    divider: 'border-[var(--vf-border)]',
    statIcon: dark ? 'text-emerald-400' : 'text-orange-600',
  };
}
