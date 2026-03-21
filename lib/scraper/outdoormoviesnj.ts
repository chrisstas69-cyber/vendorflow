import { BaseScraper, ScrapedEvent } from './base';

export class OutdoorMoviesNJScraper extends BaseScraper {
  constructor() {
    super('outdoor-movies-nj', 'https://njmom.com/things-to-do/outdoor-movies/', 'NJ');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('article, .event-item, .entry, .post, [class*="event"], .wp-block-list li').each((_, el) => {
      try {
        const $el = $(el);
        const text = $el.text().trim();
        const title = $el.find('h2, h3, .title, a').first().text().trim() || text.slice(0, 80);
        const dateText = $el.find('time, .date').first().text().trim() ||
          $el.find('time').attr('datetime') || '';
        const location = $el.find('.location, .venue').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || title.length < 3 || !dateText) return;

        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        events.push({
          title,
          event_date: eventDate,
          location: location || null,
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          source: this.name,
          event_type: 'outdoor_movie',
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
