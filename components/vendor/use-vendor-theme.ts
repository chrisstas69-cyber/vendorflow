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
    accent: 'text-amber-600 dark:text-amber-400',
    btnPrimary: 'bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold',
    btnSecondary: dark
      ? 'border-gray-700 bg-gray-800 hover:bg-gray-750 text-gray-200'
      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800',
  };
}
