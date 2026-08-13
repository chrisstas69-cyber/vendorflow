import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PublicLayout } from '@/components/layout/public-layout';
import { DiscoverExplore } from '@/components/discover/discover-explore';
export const metadata:Metadata={title:'Events this weekend in New York & New Jersey',description:'Find fairs, festivals, markets, car shows, and community events happening this weekend across NY and NJ.'};
export default function WeekendEventsPage(){return <PublicLayout><div className="mx-auto max-w-7xl px-4 py-10"><Suspense fallback={<p>Loading events…</p>}><DiscoverExplore weekendOnly pageTitle="Events this weekend" pageDescription="Fairs, markets, festivals, and community events across New York and New Jersey."/></Suspense></div></PublicLayout>}
