import { BaseScraper, ScrapedEvent } from './base';
import { detectRegionFromLocation } from '../event-tagger';

export class LightsFestScraper extends BaseScraper {
  constructor() {
    super('lights-fest', 'https://www.thelightsfest.com/events', 'Long Island');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('article, .event-item, .event-card, [class*="event"], .col, .card').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('h2, h3, h4, .title, a').first().text().trim();
        const dateText = $el.find('time, .date, .event-date').first().text().trim() ||
          $el.find('time').attr('datetime') || '';
        const location = $el.find('.location, .venue').first().text().trim() || title;
        const link = $el.find('a').first().attr('href');

        if (!title || title.length < 3 || !dateText) return;

        // Filter for NY/NJ area
        const combined = `${title} ${location}`.toLowerCase();
        const isNYNJ = ['new york', 'long island', 'new jersey', 'nj', 'ny', 'nassau', 'suffolk'].some(k => combined.includes(k));
        if (!isNYNJ) return;

        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        const region = detectRegionFromLocation(combined, this.region);

        events.push({
          title: `The Lights Fest: ${title}`,
          event_date: eventDate,
          location: location || null,
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          source: this.name,
          event_type: 'light_festival',
          region,
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
