'use client';

import { ThemeProvider } from '@/contexts/theme-context';
import { AuthProvider } from '@/contexts/auth-context';
import { DemoStoreProvider } from '@/contexts/demo-store-context';
import { EventDebriefProvider } from '@/contexts/event-debrief-context';
import { VendorFinancialProvider } from '@/contexts/vendor-financial-context';
import { RoleProvider } from '@/contexts/role-context';
import { VendorPassportProvider } from '@/contexts/vendor-passport-context';
import { OrganizerProvider } from '@/contexts/organizer-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RoleProvider>
          <OrganizerProvider>
            <DemoStoreProvider>
              <VendorFinancialProvider>
                <EventDebriefProvider>
                  <VendorPassportProvider>{children}</VendorPassportProvider>
                </EventDebriefProvider>
              </VendorFinancialProvider>
            </DemoStoreProvider>
          </OrganizerProvider>
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
