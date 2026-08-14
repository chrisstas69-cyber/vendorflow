import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { createSessionPayload, safeAuthDestination, sessionCookieName, signSession, verifySession } from '@/lib/auth/session';
import { requireCronSecret, requireRole, requireSession } from '@/lib/auth/guards';

process.env.AUTH_SECRET = 'test-secret-that-is-long-enough-for-tests';

function requestWithSession(role?: 'vendor' | 'organizer') {
  const headers = new Headers();
  if (role) {
    const token = signSession(createSessionPayload(`${role}@example.com`, role));
    headers.set('cookie', `${sessionCookieName()}=${token}`);
  }
  return new NextRequest('http://localhost/api/test', { headers });
}

test('signed sessions verify and tampered sessions fail', () => {
  const token = signSession(createSessionPayload('VENDOR@example.com', 'vendor'));
  assert.equal(verifySession(token)?.email, 'vendor@example.com');
  assert.equal(verifySession(`${token}tampered`), null);
});

test('private routes reject anonymous and cross-role requests', () => {
  assert.equal(requireSession(requestWithSession()).ok, false);
  assert.equal(requireRole(requestWithSession('vendor'), 'organizer').ok, false);
  assert.equal(requireRole(requestWithSession('organizer'), 'organizer').ok, true);
});

test('post-login destinations stay internal and match the selected role', () => {
  assert.equal(safeAuthDestination('/pulse?eventId=evt-001', 'vendor'), '/pulse?eventId=evt-001');
  assert.equal(safeAuthDestination('/organizer/applications', 'organizer'), '/organizer/applications');
  assert.equal(safeAuthDestination('/organizer', 'vendor'), null);
  assert.equal(safeAuthDestination('/pulse', 'organizer'), null);
  assert.equal(safeAuthDestination('//evil.example', 'vendor'), null);
  assert.equal(safeAuthDestination('https://evil.example', 'vendor'), null);
});

test('cron routes fail closed and accept only the configured bearer secret', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
  delete process.env.CRON_SECRET;
  assert.equal(requireCronSecret(new NextRequest('http://localhost/api/cron'))?.status, 503);
  process.env.CRON_SECRET = 'cron-test-secret';
  assert.equal(requireCronSecret(new NextRequest('http://localhost/api/cron'))?.status, 401);
  assert.equal(requireCronSecret(new NextRequest('http://localhost/api/cron', {
    headers: { authorization: 'Bearer cron-test-secret' },
  })), null);
  (process.env as Record<string, string | undefined>).NODE_ENV = previousNodeEnv;
});
