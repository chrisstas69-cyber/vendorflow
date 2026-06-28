'use client';

import type { OrganizerApplicationInboxItem, OrganizerDisplayStage } from '@/lib/organizer-schema';
import { DISPLAY_PIPELINE_COLUMNS } from '@/lib/organizer-schema';
import type { InboxAction } from '@/lib/organizer-schema';
import { VendorSetupPreview } from '@/components/vendor/vendor-setup-preview';
import { MatchScoreBadge } from '@/components/organizer/match-score-badge';
import {
  BoothChip,
  DocumentStatusChips,
  PaymentStatusChip,
} from '@/components/organizer/document-status-chips';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { Check, Clock, MessageSquare, Star } from 'lucide-react';

interface ApplicationPipelineBoardProps {
  items: OrganizerApplicationInboxItem[];
  onAction: (submissionId: string, action: InboxAction) => Promise<string>;
}

function columnItems(items: OrganizerApplicationInboxItem[], stage: OrganizerDisplayStage) {
  return items.filter(i => i.displayStage === stage);
}

export function ApplicationPipelineBoard({ items, onAction }: ApplicationPipelineBoardProps) {
  const { card, cardInset, muted, heading } = useOrganizerTheme();

  const handle = async (id: string, action: InboxAction) => {
    try {
      await onAction(id, action);
    } catch {
      /* parent toast */
    }
  };

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex gap-3 min-w-[960px]">
        {DISPLAY_PIPELINE_COLUMNS.map(col => {
          const cards = columnItems(items, col.id);
          return (
            <div
              key={col.id}
              className={`rounded-xl border min-h-[360px] w-52 shrink-0 flex flex-col ${cardInset}`}
            >
              <div className={`p-3 border-b ${card}`}>
                <div className={`font-semibold text-sm ${heading}`}>{col.label}</div>
                <div className={`text-xs ${muted}`}>{col.description}</div>
                <div className="text-xs font-medium text-teal-600 mt-1">
                  {cards.length} vendor{cards.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[520px]">
                {cards.length === 0 ? (
                  <p className={`text-xs text-center py-8 ${muted}`}>Empty</p>
                ) : (
                  cards.map(item => (
                    <div key={item.id} className={`rounded-lg border p-3 shadow-sm ${card}`}>
                      <div className="flex gap-2 mb-2">
                        <VendorSetupPreview
                          src={item.setupPhotoUrl}
                          vendorName={item.vendorName}
                          category={item.category}
                          size="sm"
                          className="w-12 h-12 shrink-0 rounded-md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className={`font-semibold text-sm truncate flex items-center gap-1 ${heading}`}>
                            {item.vendorName}
                            {item.shortlisted && (
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className={`text-xs truncate ${muted}`}>{item.eventName}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-1">
                        <PaymentStatusChip status={item.paymentStatus} />
                        <BoothChip boothId={item.boothId} />
                      </div>

                      <DocumentStatusChips
                        missing={item.missingDocTypes}
                        uploaded={item.uploadedDocTypes}
                      />

                      <div className="mt-2">
                        <MatchScoreBadge vendorEmail={item.vendorEmail} eventId={item.eventId} />
                      </div>

                      {item.displayStage === 'applied' || item.displayStage === 'docs' ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <button
                            type="button"
                            onClick={() => handle(item.id, 'accept')}
                            className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold rounded bg-teal-600 text-white"
                          >
                            <Check className="h-3 w-3" /> Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handle(item.id, 'waitlist')}
                            className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold rounded border"
                          >
                            <Clock className="h-3 w-3" /> Waitlist
                          </button>
                          <button
                            type="button"
                            onClick={() => handle(item.id, 'request_info')}
                            className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold rounded border text-teal-700"
                          >
                            <MessageSquare className="h-3 w-3" /> Info
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
