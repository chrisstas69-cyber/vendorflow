import type { Metadata } from 'next';
import { findPlatformEventById } from '@/lib/event-lookup';
import { EventDetailClient } from './event-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = findPlatformEventById(id);
  if (!event) {
    return { title: 'Event not found' };
  }
  // Root layout template appends "| VendorFlow" — don't duplicate the brand.
  const title = `${event.name} — ${event.city}, ${event.state}`;
  const description = `${event.description} ${event.city}, ${event.state} on ${event.date}. Save and share this event on VendorFlow.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: event.coverImageUrl ? [{ url: event.coverImageUrl }] : undefined,
    },
  };
}

function eventJsonLd(id: string) {
  const event = findPlatformEventById(id);
  if (!event) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: event.date,
    description: event.description,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.city,
        addressRegion: event.state,
        addressCountry: 'US',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: event.organizerName,
    },
    image: event.coverImageUrl ? [event.coverImageUrl] : undefined,
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const jsonLd = eventJsonLd(id);
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EventDetailClient />
    </>
  );
}
