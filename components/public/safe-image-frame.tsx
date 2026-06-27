'use client';

import Image from 'next/image';

/** Image wrapper with inline layout so photos don't blow up full-screen if CSS fails to load */
export function SafeImageFrame({
  src,
  alt,
  height = 128,
  priority = false,
  sizes = '100vw',
  className = '',
  imgClassName = 'object-cover',
}: {
  src: string;
  alt: string;
  height?: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={imgClassName}
      />
    </div>
  );
}
