import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionCookieName, verifySession } from '@/lib/auth/session';

export default async function CommunityVendorProtectedLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const token = (await cookies()).get(sessionCookieName())?.value;
  const session = token ? verifySession(token) : null;
  if (process.env.NODE_ENV === 'production' && session?.role !== 'vendor') {
    const { slug } = await params;
    redirect(`/login?role=vendor&next=${encodeURIComponent(`/community-events/${slug}/vendor`)}`);
  }
  return children;
}
