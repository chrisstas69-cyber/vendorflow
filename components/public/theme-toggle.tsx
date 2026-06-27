'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

export function PublicThemeToggle({ compact }: { compact?: boolean }) {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'night';

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center gap-2 rounded-lg border public-theme-toggle transition-colors ${
        compact ? 'p-2' : 'px-3 py-2 text-xs font-semibold'
      }`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!compact && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  );
}
