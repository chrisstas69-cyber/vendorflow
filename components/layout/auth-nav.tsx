'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { LogIn, LogOut, User } from 'lucide-react';

interface AuthNavProps {
  accent?: 'amber' | 'teal';
  compact?: boolean;
}

export function AuthNav({ accent = 'amber', compact }: AuthNavProps) {
  const { session, ready, signOut } = useAuth();

  const signInClass =
    accent === 'teal'
      ? 'text-teal-700 hover:bg-teal-50 border-teal-200'
      : 'text-amber-800 hover:bg-amber-50 border-amber-200';

  if (!ready) {
    return <div className="h-8 w-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold ${signInClass}`}
      >
        <LogIn className="h-3.5 w-3.5" />
        {!compact && 'Sign in'}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium max-w-[140px] truncate ${
          accent === 'teal'
            ? 'bg-teal-50 text-teal-800'
            : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
        }`}
        title={session.email}
      >
        <User className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{session.email}</span>
      </span>
      <button
        type="button"
        onClick={() => signOut()}
        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Sign out"
      >
        <LogOut className="h-3.5 w-3.5" />
        {!compact && 'Out'}
      </button>
    </div>
  );
}
