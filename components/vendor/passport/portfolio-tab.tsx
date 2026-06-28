'use client';

import { useVendorPassport } from '@/contexts/vendor-passport-context';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import { TrustGalleryEditor } from '@/components/gallery/trust-gallery-editor';
import { TrustGalleryView } from '@/components/gallery/trust-gallery-view';
import { useGallery } from '@/hooks/use-gallery';

export function PassportPortfolioTab() {
  const { passport } = useVendorPassport();
  const { card, input, muted, heading, btnPrimary } = useVendorTheme();
  const { items, loading, refresh } = useGallery('vendor', passport.vendorEmail);

  return (
    <div className="space-y-8">
      <TrustGalleryEditor
        entityType="vendor"
        entityId={passport.vendorEmail}
        items={items}
        loading={loading}
        onRefresh={refresh}
        surfaceClass={`rounded-xl p-4 ${card}`}
        inputClass={`w-full text-sm rounded-lg border px-3 py-2 ${input}`}
        mutedClass={muted}
        headingClass={`font-semibold ${heading}`}
        btnPrimaryClass={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${btnPrimary}`}
      />

      <div>
        <h3 className={`font-semibold mb-2 ${heading}`}>Public preview</h3>
        <p className={`text-sm mb-4 ${muted}`}>
          What organizers see when reviewing your application.
        </p>
        <TrustGalleryView
          entityType="vendor"
          items={items.filter(i => i.isPublic)}
          fallbackImageUrl={passport.setupPhotoUrl}
          compact
        />
      </div>
    </div>
  );
}
