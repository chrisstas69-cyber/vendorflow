'use client';

import { useState } from 'react';
import Link from 'next/link';
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
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold public-heading mb-2">Sign in</h1>
        <p className="text-sm public-muted mb-6">
          Magic link — no password. Add <code className="text-xs">RESEND_API_KEY</code> later for email delivery.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="public-muted">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 public-input"
              placeholder="you@example.com"
            />
          </label>

          <div className="flex gap-2">
            {(['vendor', 'organizer'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${
                  role === r ? 'bg-amber-400 text-gray-900 border-amber-400' : 'public-input'
                }`}
              >
                {r === 'vendor' ? 'Vendor' : 'Organizer'}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-400 text-gray-900 font-bold disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>

        {message && <p className="mt-4 text-sm public-muted">{message}</p>}
        {devLink && (
          <div className="mt-4 p-3 rounded-lg border text-sm break-all public-input">
            <div className="font-semibold mb-1">Dev sign-in link</div>
            <a href={devLink} className="text-amber-600 hover:underline">
              {devLink}
            </a>
          </div>
        )}

        <p className="mt-8 text-center text-sm public-muted">
          <Link href="/discover" className="text-amber-600 hover:underline">
            Continue without signing in
          </Link>
        </p>
      </div>
    </PublicLayout>
  );
}
