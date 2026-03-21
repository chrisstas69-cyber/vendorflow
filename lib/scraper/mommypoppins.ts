import { BaseScraper, ScrapedEvent } from './base';

export class MommyPoppinsScraper extends BaseScraper {
  constructor() {
    super('mommypoppins', 'https://mommypoppins.com/long-island/events');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    // MommyPoppins uses article cards with metadata
    $('article, .event-card, .listing-card, .event-item').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('h2, h3, .title, .event-title a').first().text().trim();
        const dateText = $el.find('.date, time, .event-date, .meta-date').first().text().trim();
        const location = $el.find('.location, .venue, .event-location').first().text().trim();
        const desc = $el.find('.excerpt, .description, .summary, p').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || !dateText) return;
        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        events.push({
          title,
          event_date: eventDate,
          location: location || null,
          description: desc || null,
          url: link ? new URL(link, 'https://mommypoppins.com').href : this.baseUrl,
          source: this.name,
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
