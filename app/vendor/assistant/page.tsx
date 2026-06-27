'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { AssistantChatPanel } from '@/components/assistant/chat-panel';
import { FoundersEditionBanner } from '@/components/founders/founders-banner';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';

export default function VendorAssistantPage() {
  const { heading, muted } = useVendorTheme();

  return (
    <AppLayout title="Assistant">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="mb-6 space-y-4">
          <div>
            <h1 className={`text-2xl font-bold ${heading}`}>Vendor Assistant</h1>
            <p className={`text-sm mt-1 ${muted}`}>
              Event discovery, compliance docs, and application help
            </p>
          </div>
          <FoundersEditionBanner compact />
        </div>
        <AssistantChatPanel role="vendor" />
      </div>
    </AppLayout>
  );
}
