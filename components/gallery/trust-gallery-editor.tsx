'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Camera,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import type { GalleryEntityType, GalleryItemRecord, GalleryTag } from '@/lib/gallery-schema';
import { GALLERY_CONTEXT_COPY, GALLERY_TAGS } from '@/lib/gallery-schema';
import { GalleryTagChip } from '@/components/gallery/gallery-tag-chip';
import { TrustGalleryEmptyState } from '@/components/gallery/trust-gallery-empty-state';
import {
  createGalleryItemApi,
  deleteGalleryItemApi,
  reorderGalleryApi,
  updateGalleryItemApi,
  uploadGalleryImage,
} from '@/hooks/use-gallery';

interface TrustGalleryEditorProps {
  entityType: GalleryEntityType;
  entityId: string;
  items: GalleryItemRecord[];
  loading?: boolean;
  onRefresh: () => void;
  /** Tailwind card/surface classes from theme hook */
  surfaceClass?: string;
  inputClass?: string;
  mutedClass?: string;
  headingClass?: string;
  btnPrimaryClass?: string;
}

export function TrustGalleryEditor({
  entityType,
  entityId,
  items,
  loading,
  onRefresh,
  surfaceClass = 'rounded-2xl p-4 bg-white shadow-sm ring-1 ring-stone-200/80',
  inputClass = 'w-full text-sm rounded-lg border px-3 py-2 border-stone-200',
  mutedClass = 'text-stone-500',
  headingClass = 'font-semibold text-stone-900',
  btnPrimaryClass = 'px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700',
}: TrustGalleryEditorProps) {
  const copy = GALLERY_CONTEXT_COPY[entityType];
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const imageUrl = await uploadGalleryImage(file);
      await createGalleryItemApi({
        entityType,
        entityId,
        imageUrl,
        isPublic: true,
        tags: entityType === 'vendor' ? ['booth', 'setup'] : entityType === 'event' ? ['crowd'] : ['crowd', 'family'],
      });
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleTag = async (item: GalleryItemRecord, tag: GalleryTag) => {
    const tags = item.tags.includes(tag)
      ? item.tags.filter(t => t !== tag)
      : [...item.tags, tag];
    await updateGalleryItemApi(item.id, { tags });
    onRefresh();
  };

  const setCover = async (id: string) => {
    await updateGalleryItemApi(id, { isCover: true });
    onRefresh();
  };

  const togglePublic = async (item: GalleryItemRecord) => {
    await updateGalleryItemApi(item.id, { isPublic: !item.isPublic });
    onRefresh();
  };

  const updateCaption = async (id: string, caption: string) => {
    await updateGalleryItemApi(id, { caption });
    onRefresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this photo from the gallery?')) return;
    await deleteGalleryItemApi(id);
    onRefresh();
  };

  const onDropReorder = useCallback(
    async (targetId: string) => {
      if (!dragId || dragId === targetId) return;
      const ids = sorted.map(i => i.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      if (from < 0 || to < 0) return;
      ids.splice(from, 1);
      ids.splice(to, 0, dragId);
      setDragId(null);
      await reorderGalleryApi(entityType, entityId, ids);
      onRefresh();
    },
    [dragId, sorted, entityType, entityId, onRefresh]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading gallery…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className={headingClass}>{copy.title}</h3>
        <p className={`text-sm mt-1 ${mutedClass}`}>{copy.subtitle}</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className={`inline-flex items-center gap-2 ${btnPrimaryClass} disabled:opacity-60`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Add photo
        </button>
        <span className={`text-xs self-center ${mutedClass}`}>
          {sorted.length}/10 recommended · JPG/PNG/WebP, max 4 MB
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => handleUpload(e.target.files?.[0] ?? null)}
      />

      {sorted.length === 0 ? (
        <TrustGalleryEmptyState entityType={entityType} onUpload={() => fileRef.current?.click()} />
      ) : (
        <ul className="space-y-3">
          {sorted.map(item => (
            <li
              key={item.id}
              draggable
              onDragStart={() => setDragId(item.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDropReorder(item.id)}
              className={`flex gap-3 ${surfaceClass} ${!item.isPublic ? 'opacity-75' : ''}`}
            >
              <div className={`cursor-grab active:cursor-grabbing pt-1 ${mutedClass}`} aria-label="Drag to reorder">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="relative w-24 h-20 shrink-0 rounded-lg overflow-hidden bg-stone-100">
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized={item.imageUrl.startsWith('data:')}
                />
                {item.isCover && (
                  <span className="absolute top-1 left-1 p-0.5 rounded bg-amber-400 text-gray-900">
                    <Star className="h-3 w-3 fill-current" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  type="text"
                  placeholder="Caption — what is this photo showing?"
                  className={inputClass}
                  defaultValue={item.caption ?? ''}
                  onBlur={e => {
                    if (e.target.value !== (item.caption ?? '')) {
                      updateCaption(item.id, e.target.value);
                    }
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {GALLERY_TAGS.map(tag => (
                    <GalleryTagChip
                      key={tag}
                      tag={tag}
                      active={item.tags.includes(tag)}
                      onClick={() => toggleTag(item, tag)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {!item.isCover && (
                  <button
                    type="button"
                    title="Set as cover"
                    onClick={() => setCover(item.id)}
                    className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  title={item.isPublic ? 'Public' : 'Private'}
                  onClick={() => togglePublic(item)}
                  className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
                >
                  {item.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  title="Remove"
                  onClick={() => remove(item.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className={`text-xs mt-4 flex items-start gap-2 ${mutedClass}`}>
        <Camera className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        Public photos appear on event pages and help vendors decide to apply. Private photos are for your team only.
      </p>
    </div>
  );
}
