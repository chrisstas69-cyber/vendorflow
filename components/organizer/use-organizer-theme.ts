'use client';

import { useTheme } from '@/contexts/theme-context';

/** Restrained organizer dashboard tokens — neutral surfaces + teal accent */
export function useOrganizerTheme() {
  const { mode } = useTheme();
  const dark = mode === 'night';

  return {
    dark,
    accent: 'teal',
    shell: dark ? 'bg-stone-950 text-stone-100' : 'bg-stone-100 text-stone-900',
    sidebar: dark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200',
    card: dark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200',
    cardInset: dark ? 'bg-stone-800/50 border-stone-700' : 'bg-stone-50 border-stone-100',
    muted: dark ? 'text-stone-400' : 'text-stone-500',
    heading: dark ? 'text-stone-50' : 'text-stone-900',
    label: dark ? 'text-stone-300' : 'text-stone-700',
    pageTitle: 'text-2xl md:text-[1.75rem] font-bold tracking-tight',
    sectionTitle: 'text-lg font-semibold',
    navActive: dark
      ? 'bg-teal-950/60 text-teal-300'
      : 'bg-teal-50 text-teal-800',
    navIdle: dark
      ? 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
    btnPrimary: 'bg-teal-600 hover:bg-teal-700 text-white font-semibold',
    btnSecondary: dark
      ? 'border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200'
      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800',
    divider: dark ? 'border-stone-800' : 'border-stone-200',
    statIcon: dark ? 'text-teal-400' : 'text-teal-600',
  };
}
