import { BaseScraper } from './base';
// Tier 1 — NY High Value
import { NassauCountyFairsScraper } from './nassaucountyfairs';
import { LIFairsScraper } from './lifairs';
import { LongIslandEventsScraper } from './longislandevents';
import { FairsAndFestivalsScraper } from './fairsandfestivals';
// Tier 2 — NY High Value
import { EventbriteScraper } from './eventbrite';
import { MommyPoppinsScraper } from './mommypoppins';
import { DiscoverLongIslandScraper } from './discoverlongisland';
import { LongIslandPressScraper } from './longislandpress';
// Tier 3 — NY Supplemental
import { PatchScraper } from './patch';
import { ChambersScraper } from './chambers';
// Tier 4 — NJ Core
import { FairsAndFestivalsNJScraper } from './fairsandfestivalsnj';
import { VisitNJScraper } from './visitnj';
import { NJFamilyScraper } from './njfamily';
import { StreetFairsScraper } from './streetfairs';
import { NJCarnivalsScraper } from './njcarnivals';
import { NJMomFireworksScraper } from './njmomfireworks';
// Tier 5 — Fireworks Companies
import { GrucciScraper } from './grucci';
import { ZambelliScraper } from './zambelli';
import { MelroseScraper } from './melrose';
import { PyroSpecScraper } from './pyrospec';
// Tier 6 — Light Festivals
import { WaterLanternScraper } from './waterlantern';
import { LightsFestScraper } from './lightsfest';
// Tier 7 — Carnival Companies
import { DreamlandScraper } from './dreamland';
import { NewtonShowsScraper } from './newtonshows';
// Tier 8 — Family/Kids Sources
import { NJKidsOnlineScraper } from './njkidsonline';
import { NJMomScraper } from './njmom';
import { NJParentingScraper } from './njparenting';
import { OceanCountyTourismScraper } from './oceancountytourism';
import { WildwoodsScraper } from './wildwoods';
import { OutdoorMoviesLIScraper } from './outdoormoviesli';
import { OutdoorMoviesNJScraper } from './outdoormoviesnj';

export const ALL_SCRAPERS: BaseScraper[] = [
  // Tier 1 — NY High Value
  new NassauCountyFairsScraper(),
  new LIFairsScraper(),
  new LongIslandEventsScraper(),
  new FairsAndFestivalsScraper(),
  // Tier 2 — NY High Value
  new EventbriteScraper(),
  new MommyPoppinsScraper(),
  new DiscoverLongIslandScraper(),
  new LongIslandPressScraper(),
  // Tier 3 — NY Supplemental
  new PatchScraper(),
  new ChambersScraper(),
  // Tier 4 — NJ Core
  new FairsAndFestivalsNJScraper(),
  new VisitNJScraper(),
  new NJFamilyScraper(),
  new StreetFairsScraper(),
  new NJCarnivalsScraper(),
  new NJMomFireworksScraper(),
  // Tier 5 — Fireworks Companies
  new GrucciScraper(),
  new ZambelliScraper(),
  new MelroseScraper(),
  new PyroSpecScraper(),
  // Tier 6 — Light Festivals
  new WaterLanternScraper(),
  new LightsFestScraper(),
  // Tier 7 — Carnival Companies
  new DreamlandScraper(),
  new NewtonShowsScraper(),
  // Tier 8 — Family/Kids
  new NJKidsOnlineScraper(),
  new NJMomScraper(),
  new NJParentingScraper(),
  new OceanCountyTourismScraper(),
  new WildwoodsScraper(),
  new OutdoorMoviesLIScraper(),
  new OutdoorMoviesNJScraper(),
];

export function getScraperByName(name: string): BaseScraper | undefined {
  return ALL_SCRAPERS.find(s => s.name === name);
}

export function getScrapersByRegion(region: 'NY' | 'NJ'): BaseScraper[] {
  if (region === 'NJ') return ALL_SCRAPERS.filter(s => s.region === 'NJ');
  return ALL_SCRAPERS.filter(s => s.region !== 'NJ');
}

export { BaseScraper, type ScrapedEvent } from './base';
