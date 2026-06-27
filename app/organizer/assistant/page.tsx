'use client';

import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { AssistantChatPanel } from '@/components/assistant/chat-panel';
import { FoundersEditionBanner } from '@/components/founders/founders-banner';

export default function OrganizerAssistantPage() {
  return (
    <OrganizerLayout>
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Organizer Assistant</h1>
          <p className="text-gray-600 text-sm">
            Call sheets, vendor pools, permit deadlines — with one-click actions
          </p>
        </div>
        <FoundersEditionBanner compact />
      </div>
      <AssistantChatPanel role="organizer" />
    </OrganizerLayout>
  );
}
