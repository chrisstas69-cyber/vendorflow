'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Sparkles } from 'lucide-react';
import { PublicLayout } from '@/components/layout/public-layout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'vendor' | 'organizer'>('vendor');
  const [message, setMessage] = useState('');
  const [devLink, setDevLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setDevLink('');
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      setMessage(data.message ?? (data.ok ? 'Check your email' : data.error));
      if (data.devLink) setDevLink(data.devLink);
    } catch {
      setMessage('Something went wrong — try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-16 sm:py-20">
        <div className="rounded-2xl border vf-border vf-surface p-6 sm:p-8 shadow-sm animate-fade-up">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-amber-700 text-white mb-5">
            <Mail size={18} />
          </div>
          <h1 className="text-2xl font-bold vf-text tracking-tight">Sign in</h1>
          <p className="text-sm vf-text-muted mt-2 leading-relaxed">
            Magic link — no password. Vendors land in Pulse; organizers go to the hub.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="vf-text-muted text-xs font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border vf-border vf-surface px-3 py-2.5 text-sm vf-text placeholder:vf-text-subtle focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50"
                placeholder="you@example.com"
              />
            </label>

            <div>
              <span className="vf-text-muted text-xs font-medium">I am a…</span>
              <div className="mt-1.5 flex gap-2">
                {(['vendor', 'organizer'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                      role === r
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'vf-surface vf-border vf-text-muted hover:vf-surface-2'
                    }`}
                  >
                    {r === 'vendor' ? 'Vendor' : 'Organizer'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold disabled:opacity-50 transition-colors shadow-lg shadow-orange-600/20 inline-flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              {loading ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-sm vf-text-muted">{message}</p>
          )}
          {devLink && (
            <div className="mt-3 rounded-lg border vf-border vf-bg-subtle p-3">
              <p className="text-[11px] font-medium vf-text-subtle mb-1">Dev magic link</p>
              <Link href={devLink} className="text-sm font-medium text-orange-600 break-all hover:underline">
                {devLink}
              </Link>
            </div>
          )}

          <p className="mt-6 text-xs vf-text-subtle text-center">
            New here?{' '}
            <Link href="/for-vendors" className="text-orange-600 hover:underline">
              Vendors
            </Link>
            {' · '}
            <Link href="/for-organizers" className="text-orange-600 hover:underline">
              Organizers
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
