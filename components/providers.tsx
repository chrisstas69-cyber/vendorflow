'use client';

import { ThemeProvider } from '@/contexts/theme-context';
import { DemoStoreProvider } from '@/contexts/demo-store-context';
import { RoleProvider } from '@/contexts/role-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <RoleProvider>
        <DemoStoreProvider>{children}</DemoStoreProvider>
      </RoleProvider>
    </ThemeProvider>
  );
}
