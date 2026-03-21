import { BaseScraper, ScrapedEvent } from './base';

export class FairsAndFestivalsScraper extends BaseScraper {
  constructor() {
    super('fairsandfestivals', 'https://fairsandfestivals.net/states/NY');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    // fairsandfestivals.net uses HTML table rows with structured data
    $('table tr, .event-row, .fair-listing').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('td:first-child, .name').first().text().trim();
        const dateText = $el.find('td:nth-child(2), .dates').first().text().trim();
        const location = $el.find('td:nth-child(3), .location').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || !dateText) return;

        // Filter for Nassau/Suffolk only
        const loc = location.toLowerCase();
        if (!loc.includes('nassau') && !loc.includes('suffolk') && !this.isLITown(loc)) return;

        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        events.push({
          title,
          event_date: eventDate,
          location: location || null,
          county: loc.includes('nassau') ? 'Nassau' : loc.includes('suffolk') ? 'Suffolk' : null,
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          source: this.name,
        });
      } catch { /* skip */ }
    });

    return events;
  }

  private isLITown(text: string): boolean {
    const liTowns = ['huntington', 'babylon', 'patchogue', 'smithtown', 'massapequa',
      'garden city', 'hempstead', 'freeport', 'rockville centre', 'long beach',
      'glen cove', 'oyster bay', 'brookhaven', 'islip', 'riverhead', 'southampton'];
    return liTowns.some(t => text.includes(t));
  }
}
