import { BaseScraper, ScrapedEvent } from './base';

export class LongIslandEventsScraper extends BaseScraper {
  constructor() {
    super('lievents', 'https://events.longisland.com/festivals-carnivals');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    // events.longisland.com uses structured event listing cards
    $('.event-listing, .event-card, .event-item, article.event').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('.event-title, h2, h3, .title a').first().text().trim();
        const dateText = $el.find('.event-date, .date, time, .when').first().text().trim();
        const timeText = $el.find('.event-time, .time').first().text().trim();
        const location = $el.find('.event-location, .location, .venue, .where').first().text().trim();
        const desc = $el.find('.event-description, .description, .summary, p').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || !dateText) return;
        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        events.push({
          title,
          event_date: eventDate,
          event_time: timeText || null,
          location: location || null,
          description: desc || null,
          url: link ? new URL(link, 'https://events.longisland.com').href : this.baseUrl,
          source: this.name,
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
