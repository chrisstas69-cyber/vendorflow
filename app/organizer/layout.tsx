import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionCookieName, verifySession } from '@/lib/auth/session';

export default async function OrganizerProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(sessionCookieName())?.value;
  const session = token ? verifySession(token) : null;
  if (process.env.NODE_ENV === 'production' && session?.role !== 'organizer') {
    redirect('/login?role=organizer&next=/organizer');
  }
  return children;
}
