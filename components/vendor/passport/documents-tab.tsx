'use client';

import { useVendorPassport } from '@/contexts/vendor-passport-context';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import { SetupPhotoUpload } from '@/components/vendor/setup-photo-upload';
import { DOCUMENT_LABELS, type DocumentType } from '@/lib/documents';
import { Trash2 } from 'lucide-react';

const PASSPORT_DOC_TYPES: DocumentType[] = ['coi', 'w9', 'booth-layout', 'food-permit', 'vehicle-info', 'other'];

export function PassportDocumentsTab() {
  const { passport, addDocument, removeDocument, setSetupPhoto, saving } = useVendorPassport();
  const { cardInset, muted, heading, btnSecondary, dark } = useVendorTheme();

  const mockUpload = (type: DocumentType) => {
    const name = `${type.toUpperCase()}_${passport.businessName.replace(/\s+/g, '_') || 'vendor'}.pdf`;
    addDocument(type, name);
  };

  return (
    <div className="space-y-8 max-w-xl">
      <section>
        <SetupPhotoUpload
          value={passport.setupPhotoUrl}
          onChange={url => setSetupPhoto(url)}
          label="Booth / setup photo"
        />
      </section>

      <section>
        <h3 className={`font-semibold mb-1 ${heading}`}>Compliance documents</h3>
        <p className={`text-xs mb-4 ${muted}`}>
          COI and W-9 are required for match-ready status. Demo mode stores filenames only.
        </p>

        <div className="space-y-2 mb-4">
          {passport.documents.length === 0 ? (
            <p className={`text-sm ${muted}`}>No documents uploaded yet.</p>
          ) : (
            passport.documents.map(doc => (
              <div
                key={doc.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${cardInset}`}
              >
                <div>
                  <div className={`text-sm font-medium ${heading}`}>{DOCUMENT_LABELS[doc.type]}</div>
                  <div className={`text-xs ${muted}`}>{doc.fileName}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(doc.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                  aria-label="Remove document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {PASSPORT_DOC_TYPES.map(type => {
            const has = passport.documents.some(d => d.type === type);
            return (
              <button
                key={type}
                type="button"
                disabled={has || saving}
                onClick={() => mockUpload(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-40 hover:border-amber-400 ${btnSecondary}`}
              >
                + {DOCUMENT_LABELS[type].split('(')[0].trim()}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
