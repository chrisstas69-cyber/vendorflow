'use client';

import { useTheme } from '@/contexts/theme-context';

/** Shared light/dark tokens for vendor hub pages */
export function useVendorTheme() {
  const { mode } = useTheme();
  const dark = mode === 'night';

  return {
    dark,
    card: dark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white',
    cardInset: dark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100',
    muted: dark ? 'text-gray-400' : 'text-gray-500',
    heading: dark ? 'text-gray-100' : 'text-gray-900',
    label: dark ? 'text-gray-300' : 'text-gray-700',
    accent: dark ? 'text-amber-400' : 'text-amber-700',
    input: dark
      ? 'border-gray-700 bg-gray-800 text-gray-100'
      : 'border-gray-300 bg-white text-gray-900',
    tabActive: dark
      ? 'border-amber-400 text-amber-300'
      : 'border-amber-500 text-amber-800',
    tabIdle: dark
      ? 'border-transparent text-gray-400 hover:text-gray-200'
      : 'border-transparent text-gray-500 hover:text-gray-800',
    divider: dark ? 'border-gray-800' : 'border-gray-200',
    btnPrimary: 'bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold',
    btnSecondary: dark
      ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-200'
      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800',
  };
}
