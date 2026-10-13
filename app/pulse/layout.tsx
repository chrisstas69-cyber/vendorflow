import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionCookieName, verifySession } from '@/lib/auth/session';

export default async function VendorPulseProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(sessionCookieName())?.value;
  const session = token ? verifySession(token) : null;
  if (process.env.NODE_ENV === 'production' && session?.role !== 'vendor') {
    redirect('/login?role=vendor&next=/pulse');
  }
  return children;
}
