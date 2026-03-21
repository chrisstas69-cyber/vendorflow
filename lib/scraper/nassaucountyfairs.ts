import { BaseScraper, ScrapedEvent } from './base';

export class NassauCountyFairsScraper extends BaseScraper {
  constructor() {
    super('nassaucountyfairs', 'https://nassaucountyfairs.com');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    // Nassau County Fairs typically lists events in table rows or structured divs
    // Selectors need calibration against live HTML
    $('table tr, .event-item, .fair-listing, article').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('td:first-child, .event-title, h2, h3').first().text().trim();
        const dateText = $el.find('td:nth-child(2), .event-date, .date, time').first().text().trim();
        const location = $el.find('td:nth-child(3), .event-location, .location').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || !dateText) return;
        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        events.push({
          title,
          event_date: eventDate,
          location: location || null,
          town: this.extractTown(location),
          county: 'Nassau',
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          source: this.name,
        });
      } catch { /* skip malformed entries */ }
    });

    return events;
  }

  private extractTown(location: string): string | null {
    if (!location) return null;
    // Common pattern: "Venue Name, Town" or just "Town"
    const parts = location.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : location.trim();
  }
}
