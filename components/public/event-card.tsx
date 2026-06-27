'use client';

import {
  EventListingCard,
  type EventListingCardSize,
} from '@/components/event-listing-card';
import type { PlatformEvent } from '@/lib/platform-data';

export { EventListingCard };

export function PublicEventCard({
  event,
  size = 'default',
  showFeaturedBadge = true,
}: {
  event: PlatformEvent;
  size?: EventListingCardSize;
  showFeaturedBadge?: boolean;
}) {
  return (
    <EventListingCard event={event} size={size} showFeaturedBadge={showFeaturedBadge} />
  );
}
