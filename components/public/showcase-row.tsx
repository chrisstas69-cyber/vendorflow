'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ShowcaseProfile } from '@/lib/event-images';

export function ShowcaseRow({
  title,
  subtitle,
  profiles,
}: {
  title: string;
  subtitle: string;
  profiles: ShowcaseProfile[];
}) {
  return (
    <section className="mb-16">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold public-heading">{title}</h2>
        <p className="public-muted mt-1">{subtitle}</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
        {profiles.map(profile => (
          <Link
            key={profile.id}
            href={profile.href}
            className="snap-start shrink-0 w-64 md:w-72 group"
          >
            <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
              <Image
                src={profile.imageUrl}
                alt={profile.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="288px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute top-3 left-3 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/90 text-gray-900">
                {profile.type}
              </span>
            </div>
            <h3 className="font-bold public-heading group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {profile.name}
            </h3>
            <p className="text-sm public-muted line-clamp-2">{profile.subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
