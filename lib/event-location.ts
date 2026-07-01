import { mockEvents } from '@/lib/mock-data';
import { mockPlatformEvents } from '@/lib/platform-data';

export interface EventLocation {
  label: string;
  city: string;
  state: string;
  query: string;
}

const LI_DEFAULT: EventLocation = {
  label: 'Huntington, NY',
  city: 'Huntington',
  state: 'NY',
  query: 'Huntington, New York',
};

export function resolveEventLocation(eventId?: string, eventName?: string): EventLocation {
  if (eventId) {
    const mock = mockEvents.find(e => e.id === eventId);
    if (mock?.location) {
      return locationFromString(mock.location);
    }
    const platform = mockPlatformEvents.find(e => e.id === eventId);
    if (platform) {
      return {
        label: `${platform.city}, ${platform.state}`,
        city: platform.city,
        state: platform.state,
        query: `${platform.city}, ${platform.state}`,
      };
    }
  }

  if (eventName) {
    const mock = mockEvents.find(e => e.name === eventName);
    if (mock?.location) return locationFromString(mock.location);
    const platform = mockPlatformEvents.find(e => e.name === eventName);
    if (platform) {
      return {
        label: `${platform.city}, ${platform.state}`,
        city: platform.city,
        state: platform.state,
        query: `${platform.city}, ${platform.state}`,
      };
    }
  }

  return LI_DEFAULT;
}

function locationFromString(location: string): EventLocation {
  if (location.includes('NYC') || location.includes('New York')) {
    return { label: 'New York, NY', city: 'New York', state: 'NY', query: 'New York, New York' };
  }
  const parts = location.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return {
      label: location,
      city: parts[0],
      state: parts[parts.length - 1],
      query: location,
    };
  }
  return { ...LI_DEFAULT, label: location, query: `${location}, New York` };
}
