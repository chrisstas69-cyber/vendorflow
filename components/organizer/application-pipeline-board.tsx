'use client';

import type { OrganizerApplicationInboxItem, OrganizerPipelineStage } from '@/lib/organizer-schema';
import { PIPELINE_COLUMNS } from '@/lib/organizer-schema';
import type { InboxAction } from '@/lib/organizer-schema';
import { VendorSetupPreview } from '@/components/vendor/vendor-setup-preview';
import { MatchScoreBadge } from '@/components/organizer/match-score-badge';
import { Check, Clock, MessageSquare, Star } from 'lucide-react';

interface ApplicationPipelineBoardProps {
  items: OrganizerApplicationInboxItem[];
  onAction: (submissionId: string, action: InboxAction) => Promise<string>;
}

function columnItems(items: OrganizerApplicationInboxItem[], stage: OrganizerPipelineStage) {
  if (stage === 'reviewing') {
    return items.filter(i => i.pipelineStage === 'reviewing' || i.pipelineStage === 'waitlisted');
  }
  return items.filter(i => i.pipelineStage === stage);
}

export function ApplicationPipelineBoard({ items, onAction }: ApplicationPipelineBoardProps) {
  const handle = async (id: string, action: InboxAction) => {
    try {
      await onAction(id, action);
    } catch {
      /* parent may show toast */
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {PIPELINE_COLUMNS.map(col => {
        const cards = columnItems(items, col.id);
        return (
          <div key={col.id} className="rounded-xl bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 min-h-[320px] flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <div className="font-semibold text-sm">{col.label}</div>
              <div className="text-xs text-gray-500">{col.description}</div>
              <div className="text-xs font-medium text-indigo-600 mt-1">{cards.length} vendor{cards.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[520px]">
              {cards.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">Empty</p>
              ) : (
                cards.map(item => (
                  <div
                    key={item.id}
                    className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 shadow-sm"
                  >
                    <div className="flex gap-2 mb-2">
                      <VendorSetupPreview
                        src={item.setupPhotoUrl}
                        vendorName={item.vendorName}
                        category={item.category}
                        size="sm"
                        className="w-14 h-14 shrink-0 rounded-md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate flex items-center gap-1">
                          {item.vendorName}
                          {item.shortlisted && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{item.eventName}</div>
                        <div className="text-xs text-indigo-600">{item.category}</div>
                      </div>
                    </div>

                    {item.pipelineStage === 'waitlisted' && (
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 mb-2">
                        Waitlisted
                      </span>
                    )}

                    <MatchScoreBadge vendorEmail={item.vendorEmail} eventId={item.eventId} />

                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.pipelineStage !== 'approved' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handle(item.id, 'accept')}
                            className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold rounded bg-green-600 text-white"
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
                            className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold rounded border text-indigo-700"
                          >
                            <MessageSquare className="h-3 w-3" /> Info
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
