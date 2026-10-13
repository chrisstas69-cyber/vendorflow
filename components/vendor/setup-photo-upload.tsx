'use client';

import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface SetupPhotoUploadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  label?: string;
}

export function SetupPhotoUpload({
  value,
  onChange,
  label = 'Booth / setup photo',
}: SetupPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Please choose a photo (JPG or PNG)');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Photo must be under 4 MB');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.set('file', file);
      const response = await fetch('/api/uploads/setup-photo', { method: 'POST', body: form });
      const data = await response.json().catch(() => null) as { ok?: boolean; url?: string; error?: string } | null;
      if (!response.ok || !data?.url) throw new Error(data?.error || 'Photo upload failed');
      onChange(data.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="text-sm font-medium mb-1">{label}</div>
      <p className="text-xs text-gray-500 mb-2">
        Organizers love seeing your tent, table, or truck — helps them pick the best fit.
      </p>

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Your booth setup" className="w-full h-40 object-cover" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors"
        >
          <Camera className="h-8 w-8 text-gray-400" />
          <span className="text-sm font-medium">{uploading ? 'Uploading…' : 'Upload setup photo'}</span>
          <span className="text-xs text-gray-500">JPG or PNG, max 4 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={uploading}
        onChange={e => handleFile(e.target.files?.[0] ?? null)}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
