import { BaseScraper, ScrapedEvent } from './base';

export class EventbriteScraper extends BaseScraper {
  constructor() {
    super('eventbrite', 'https://www.eventbrite.com/d/ny--long-island/street-fair/');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    // Eventbrite embeds JSON-LD structured data — most reliable parsing method
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '');
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          if (item['@type'] !== 'Event') continue;
          const title = item.name;
          const startDate = item.startDate;
          if (!title || !startDate) continue;

          const d = new Date(startDate);
          const eventDate = d.toISOString().slice(0, 10);
          if (!this.isWithinDaysAhead(eventDate)) continue;

          const hours = d.getHours();
          const mins = d.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const h12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
          const eventTime = `${h12}:${mins.toString().padStart(2, '0')} ${ampm}`;

          const location = item.location?.name || item.location?.address?.addressLocality || null;

          events.push({
            title,
            event_date: eventDate,
            event_time: eventTime,
            location,
            description: item.description?.slice(0, 300) || null,
            url: item.url || this.baseUrl,
            source: this.name,
          });
        }
      } catch { /* skip malformed JSON-LD */ }
    });

    // Fallback: parse event cards if no JSON-LD
    if (events.length === 0) {
      $('[data-testid="event-card"], .search-event-card-wrapper, .eds-event-card').each((_, el) => {
        try {
          const $el = $(el);
          const title = $el.find('h2, h3, .event-card__title').first().text().trim();
          const dateText = $el.find('[data-testid="event-card-date"], .event-card__date, time').first().text().trim();
          const link = $el.find('a').first().attr('href');

          if (!title || !dateText) return;
          const eventDate = this.parseDate(dateText);
          if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

          events.push({
            title,
            event_date: eventDate,
            url: link || this.baseUrl,
            source: this.name,
          });
        } catch { /* skip */ }
      });
    }

    return events;
  }
}
