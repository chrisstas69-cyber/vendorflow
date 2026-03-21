import { BaseScraper, ScrapedEvent } from './base';

export class LIFairsScraper extends BaseScraper {
  constructor() {
    super('lifairs', 'https://lifairs.com');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('.event-card, .fair-item, article, .listing-item, tr').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('.title, h2, h3, td:first-child').first().text().trim();
        const dateText = $el.find('.date, time, td:nth-child(2)').first().text().trim();
        const location = $el.find('.location, .venue, td:nth-child(3)').first().text().trim();
        const timeText = $el.find('.time, td:nth-child(4)').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || !dateText) return;
        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        events.push({
          title,
          event_date: eventDate,
          event_time: timeText || null,
          location: location || null,
          county: this.guessCounty(location),
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          source: this.name,
        });
      } catch { /* skip */ }
    });

    return events;
  }

  private guessCounty(location: string): string | null {
    if (!location) return null;
    const l = location.toLowerCase();
    if (l.includes('nassau')) return 'Nassau';
    if (l.includes('suffolk')) return 'Suffolk';
    return null;
  }
}
