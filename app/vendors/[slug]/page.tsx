'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/public-layout';
import { TrustGalleryView } from '@/components/gallery/trust-gallery-view';
import { useGallery } from '@/hooks/use-gallery';
import { ArrowLeft, BadgeCheck, ExternalLink, Store, Zap } from 'lucide-react';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';

interface PublicVendorProfile {
  id: string;
  slug: string;
  businessName: string;
  dba?: string;
  description: string;
  website?: string;
  categories: string[];
  serviceTags: string[];
  setupPhotoUrl?: string;
  logistics: {
    boothWidthFt?: number;
    boothDepthFt?: number;
    needsElectric: boolean;
    vehicleType: string;
  };
}

export default function PublicVendorProfilePage({ params }: { params: { slug: string } }) {
  const [profile, setProfile] = useState<PublicVendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { items, loading: galleryLoading } = useGallery('vendor', DEMO_VENDOR_EMAIL, {
    publicOnly: true,
  });

  useEffect(() => {
    fetch(`/api/vendors/${params.slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.profile) setProfile(data.profile);
      })
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-sm vf-text-muted">Loading vendor…</div>
      </PublicLayout>
    );
  }

  if (!profile) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold vf-text mb-4">Vendor not found</h1>
          <Link href="/" className="text-orange-600 font-semibold hover:underline">
            ← Browse events
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const booth =
    profile.logistics.boothWidthFt && profile.logistics.boothDepthFt
      ? `${profile.logistics.boothWidthFt}×${profile.logistics.boothDepthFt} ft booth`
      : null;

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm vf-text-muted hover:vf-text mb-6">
          <ArrowLeft className="h-4 w-4" /> Events
        </Link>

        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold vf-text">{profile.businessName}</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-800">
              <BadgeCheck className="h-3.5 w-3.5" /> Vendor
            </span>
          </div>
          {profile.dba && (
            <p className="text-sm vf-text-muted">Also known as {profile.dba}</p>
          )}
          <p className="vf-text mt-3 leading-relaxed max-w-2xl">{profile.description}</p>
          <div className="flex flex-wrap gap-3 mt-4 text-sm vf-text-muted">
            {booth && (
              <span className="inline-flex items-center gap-1">
                <Store className="h-4 w-4" /> {booth}
              </span>
            )}
            {profile.logistics.needsElectric && (
              <span className="inline-flex items-center gap-1">
                <Zap className="h-4 w-4" /> Power available
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-orange-600 hover:underline"
              >
                Website <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.categories.map(c => (
              <span key={c} className="vf-bg-subtle vf-text px-3 py-1 text-xs rounded-full font-medium">
                {c}
              </span>
            ))}
            {profile.serviceTags.map(t => (
              <span key={t} className="border vf-border vf-text-muted px-3 py-1 text-xs rounded-full">
                {t.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        <TrustGalleryView
          entityType="vendor"
          items={items}
          loading={galleryLoading}
          title={profile.businessName}
          fallbackImageUrl={profile.setupPhotoUrl}
          showTagFilter
        />

        <div className="mt-8 rounded-2xl border vf-border vf-surface p-5">
          <h2 className="font-semibold vf-text mb-1">Book this vendor</h2>
          <p className="text-sm vf-text-muted mb-3">
            Organizers: invite them from your applications inbox. Vendors: keep your passport public-ready.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/for-organizers"
              className="inline-flex px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
            >
              Organizer tools
            </Link>
            <Link
              href="/vendor"
              className="inline-flex px-4 py-2 rounded-xl border vf-border text-sm font-semibold vf-text hover:border-orange-500/40"
            >
              Edit my passport
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
