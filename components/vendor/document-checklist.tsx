'use client';

import { CheckCircle2, Circle, Upload, Download } from 'lucide-react';
import {
  DOCUMENT_LABELS,
  missingDocuments,
  type DocumentType,
  type VendorDocument,
} from '@/lib/documents';

interface DocumentChecklistProps {
  required: DocumentType[];
  documents: VendorDocument[];
  onUpload?: (type: DocumentType) => void;
  onDownload?: (doc: VendorDocument) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export function DocumentChecklist({
  required,
  documents,
  onUpload,
  onDownload,
  readOnly = false,
  compact = false,
}: DocumentChecklistProps) {
  const missing = missingDocuments(required, documents);

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {required.map(type => {
        const doc = documents.find(d => d.type === type);
        const done = !!doc;

        return (
          <div
            key={type}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
              done
                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'
            }`}
          >
            {done ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-amber-500 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
                {DOCUMENT_LABELS[type]}
              </div>
              {doc && (
                <div className={`text-xs truncate ${done ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {doc.fileName}
                </div>
              )}
            </div>
            {!readOnly && !done && onUpload && (
              <button
                type="button"
                onClick={() => onUpload(type)}
                className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-white dark:bg-gray-800 border hover:bg-gray-50"
              >
                <Upload className="h-3 w-3" />
                Upload
              </button>
            )}
            {doc && onDownload && (
              <button
                type="button"
                onClick={() => onDownload(doc)}
                className="shrink-0 p-1 text-gray-500 hover:text-gray-800"
                aria-label="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
      {missing.length > 0 && !compact && (
        <p className="text-xs text-amber-700 dark:text-amber-400 pt-1">
          {missing.length} form{missing.length > 1 ? 's' : ''} still needed
        </p>
      )}
    </div>
  );
}
