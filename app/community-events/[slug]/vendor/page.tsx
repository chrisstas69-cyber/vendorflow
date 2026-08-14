import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, ExternalLink, MapPin, ShieldCheck, Store } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Vendor opportunity',
  robots: { index: false, follow: false },
};

async function getEvent(slug: string) {
  try {
    return await prisma.publicEventListing.findFirst({
      where: { slug, status: 'published', startDate: { gte: new Date(Date.now() - 14 * 86400000) } },
    });
  } catch {
    return null;
  }
}

export default async function CommunityVendorOpportunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  return (
    <AppLayout>
      <article className="mx-auto max-w-3xl p-4 md:p-8">
        <Link href={`/community-events/${event.slug}`} className="text-sm font-medium text-amber-700">← Public event page</Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-wider text-amber-700">Private vendor opportunity</p>
        <h1 className="mt-2 text-3xl font-bold">{event.name}</h1>
        <p className="mt-2 text-sm text-gray-500">These details help vendors decide whether this event fits their business. They are not a public rating of the organizer.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Info icon={Calendar} title={event.startDate.toLocaleDateString('en-US', { dateStyle: 'full' })} detail={event.vendorDeadline ? `Apply by ${event.vendorDeadline.toLocaleDateString()}` : 'Deadline not supplied'} />
          <Info icon={MapPin} title={event.venueName} detail={`${event.city}, ${event.state}`} />
        </div>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-2 font-semibold"><Store className="h-4 w-4 text-amber-600" /> Vendor details</div>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-gray-500">Booth fee</dt><dd className="font-semibold">{event.boothFeeCents != null ? `$${(event.boothFeeCents / 100).toFixed(0)}` : 'Contact organizer'}</dd></div>
            <div><dt className="text-xs text-gray-500">Application deadline</dt><dd className="font-semibold">{event.vendorDeadline?.toLocaleDateString() ?? 'Not supplied'}</dd></div>
          </dl>
          {event.vendorDetails && <div className="mt-5"><h2 className="text-sm font-semibold">Requirements</h2><p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{event.vendorDetails}</p></div>}
          {event.vendorApplicationUrl ? <a href={event.vendorApplicationUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-3 font-semibold text-gray-950">Apply with organizer <ExternalLink className="h-4 w-4" /></a> : <p className="mt-6 text-sm text-gray-500">The organizer has not published an application link yet.</p>}
          <p className="mt-4 flex items-start gap-2 text-xs text-gray-500"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" /> Confirm fees and deadlines with the organizer before paying.</p>
        </section>
      </article>
    </AppLayout>
  );
}

function Info({ icon: Icon, title, detail }: { icon: typeof Calendar; title: string; detail: string }) {
  return <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><div className="text-sm font-semibold">{title}</div><div className="mt-0.5 text-sm text-gray-500">{detail}</div></div></div>;
}
