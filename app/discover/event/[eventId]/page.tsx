import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/public-layout';
import { getDb } from '@/lib/db';
import { eventRowToListing } from '@/lib/marketplace';
import { EventListingCard } from '@/components/event-listing-card';
import { Calendar, MapPin, ExternalLink } from 'lucide-react';

interface PageProps {
  params: { eventId: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = decodeURIComponent(params.eventId);
  const db = getDb();
  const row = db.prepare('SELECT title, description FROM events WHERE event_id = ?').get(id) as
    | { title: string; description: string | null }
    | undefined;
  const title = row?.title ?? 'Event';
  return {
    title: `${title} | VendorFlow Discover`,
    description: row?.description?.slice(0, 160) ?? 'Event details from the VendorFlow marketplace index.',
  };
}

export default function ScrapedEventDetailPage({ params }: PageProps) {
  const id = decodeURIComponent(params.eventId);
  const db = getDb();
  const row = db.prepare('SELECT * FROM events WHERE event_id = ?').get(id) as
    | import('@/lib/db').EventRow
    | undefined;

  if (!row) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold public-heading mb-4">Event not found</h1>
          <Link href="/discover" className="text-amber-600 font-semibold hover:underline">
            ← Back to discover
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const listing = eventRowToListing(row);

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/discover" className="text-sm text-amber-600 font-semibold hover:underline mb-6 inline-block">
          ← Discover
        </Link>
        <div className="grid md:grid-cols-2 gap-8">
          <EventListingCard listing={listing} size="large" showFeaturedBadge={false} />
          <div>
            <h1 className="text-3xl font-bold public-heading mb-4">{row.title}</h1>
            <div className="space-y-3 text-sm public-muted mb-6">
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {row.event_date}
                {row.event_time ? ` · ${row.event_time}` : ''}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {listing.locationLabel}
              </p>
            </div>
            {row.description && (
              <p className="public-muted mb-6 leading-relaxed">{row.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mb-6">
              {listing.tags.map(tag => (
                <span key={tag} className="public-tag px-2 py-1 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            {row.url && (
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-gray-900 font-semibold rounded-lg text-sm"
              >
                View original listing <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
