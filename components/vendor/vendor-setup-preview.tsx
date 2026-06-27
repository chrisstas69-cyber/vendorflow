'use client';

import { SafeImageFrame } from '@/components/public/safe-image-frame';

interface VendorSetupPreviewProps {
  src?: string;
  vendorName: string;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VendorSetupPreview({
  src,
  vendorName,
  category,
  size = 'md',
  className = '',
}: VendorSetupPreviewProps) {
  const heights = { sm: 96, md: 160, lg: 220 };

  if (!src) {
    return (
      <div
        className={`rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-center p-4 ${className}`}
        style={{ height: heights[size] }}
      >
        <div className="text-xs text-gray-500">No setup photo yet</div>
      </div>
    );
  }

  const isDataUrl = src.startsWith('data:');

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      {isDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${vendorName} booth setup`}
          className="w-full object-cover"
          style={{ height: heights[size] }}
        />
      ) : (
        <SafeImageFrame
          src={src}
          alt={`${vendorName} booth setup`}
          height={heights[size]}
          sizes="(max-width:768px) 100vw, 320px"
        />
      )}
      {category && (
        <div className="px-3 py-1.5 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          {category} · setup preview
        </div>
      )}
    </div>
  );
}
