import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PublicLayout } from '@/components/layout/public-layout';
import { DiscoverExplore } from '@/components/discover/discover-explore';
import type { BrowseCategoryId } from '@/lib/documents';

const LABELS: Record<string,string> = { 'street-fairs':'Street fairs', 'farmers-markets':'Farmers markets', festivals:'Festivals', 'car-shows':'Car shows', 'food-trucks':'Food truck events', 'craft-fairs':'Craft fairs' };
export function generateMetadata({params}:{params:{category:string}}):Metadata { const label=LABELS[params.category]??params.category.replace(/-/g,' '); return { title:`${label} accepting vendors in NY & NJ`, description:`Find upcoming ${label.toLowerCase()} and vendor application opportunities across New York and New Jersey.` }; }
const CATEGORY_IDS: Record<string, BrowseCategoryId> = { 'street-fairs':'street-fair', 'farmers-markets':'farmers-market', festivals:'festival', 'car-shows':'car-show', 'food-trucks':'food-truck', 'craft-fairs':'craft-fair' };
export default function VendorCategoryPage({params}:{params:{category:string}}){const label=LABELS[params.category]??params.category.replace(/-/g,' ');return <PublicLayout><div className="mx-auto max-w-7xl px-4 py-10"><Suspense fallback={<p>Loading events…</p>}><DiscoverExplore initialCategory={CATEGORY_IDS[params.category] ?? 'all'} pageTitle={`${label} in NY & NJ`} pageDescription={`Browse upcoming ${label.toLowerCase()}, save opportunities, and find vendor application details.`}/></Suspense></div></PublicLayout>}
