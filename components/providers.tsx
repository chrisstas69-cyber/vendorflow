'use client';

import { ThemeProvider } from '@/contexts/theme-context';
import { DemoStoreProvider } from '@/contexts/demo-store-context';
import { EventDebriefProvider } from '@/contexts/event-debrief-context';
import { RoleProvider } from '@/contexts/role-context';
import { VendorPassportProvider } from '@/contexts/vendor-passport-context';
import { OrganizerProvider } from '@/contexts/organizer-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <RoleProvider>
        <OrganizerProvider>
          <DemoStoreProvider>
            <EventDebriefProvider>
              <VendorPassportProvider>{children}</VendorPassportProvider>
            </EventDebriefProvider>
          </DemoStoreProvider>
        </OrganizerProvider>
      </RoleProvider>
    </ThemeProvider>
  );
}
