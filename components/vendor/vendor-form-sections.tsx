'use client';

import { DocumentChecklist } from '@/components/vendor/document-checklist';
import {
  DOCUMENT_LABELS,
  missingDocuments,
  splitRequiredForms,
  type DocumentType,
  type VendorDocument,
} from '@/lib/documents';
import { Mail } from 'lucide-react';

interface VendorFormSectionsProps {
  required: DocumentType[];
  documents: VendorDocument[];
  ce200Sent?: boolean;
  onUpload?: (type: DocumentType) => void;
  onDownload?: (doc: VendorDocument) => void;
  readOnly?: boolean;
}

export function VendorFormSections({
  required,
  documents,
  ce200Sent,
  onUpload,
  onDownload,
  readOnly = false,
}: VendorFormSectionsProps) {
  const { submit, fromOrganizer } = splitRequiredForms(required);
  const missingSubmit = missingDocuments(submit, documents);
  const missingCe200 = fromOrganizer.length > 0 && !documents.some(d => d.type === 'ce200');

  return (
    <div className="space-y-4">
      {submit.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-1">Submit to organizer</h4>
          <p className="text-xs text-gray-500 mb-2">
            Upload your insurance, tax forms, and permits — the organizer receives these from you.
          </p>
          <DocumentChecklist
            required={submit}
            documents={documents}
            onUpload={onUpload}
            onDownload={onDownload}
            readOnly={readOnly}
          />
          {missingSubmit.length > 0 && !readOnly && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
              Still need to send: {missingSubmit.map(m => DOCUMENT_LABELS[m]).join(', ')}
            </p>
          )}
        </div>
      )}

      {fromOrganizer.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-1">Sign &amp; return to organizer</h4>
          <p className="text-xs text-gray-500 mb-2">
            If you have no employees, the organizer emails you a CE200 form — sign it and upload here.
          </p>
          {ce200Sent && missingCe200 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm mb-2">
              <Mail className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <span className="font-semibold">CE200 sent by organizer</span>
                <span className="text-gray-600 dark:text-gray-400"> — download, sign, upload signed copy</span>
              </span>
            </div>
          )}
          {!ce200Sent && !readOnly && (
            <p className="text-xs text-gray-500 mb-2 italic">
              Waiting for organizer to send CE200 (if required for your booth).
            </p>
          )}
          <DocumentChecklist
            required={fromOrganizer}
            documents={documents}
            onUpload={onUpload}
            onDownload={onDownload}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  );
}
