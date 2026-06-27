'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { roleFromPathname } from '@/lib/role-routes';
import type { UserRole } from '@/lib/platform-data';

const STORAGE_KEY = 'vendorflow-role';

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextValue>({
  role: 'public',
  setRole: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRoleState] = useState<UserRole>(() => roleFromPathname(pathname));

  useEffect(() => {
    const derived = roleFromPathname(pathname);
    setRoleState(derived);
    try {
      localStorage.setItem(STORAGE_KEY, derived);
    } catch {
      /* private browsing */
    }
  }, [pathname]);

  const setRole = (r: UserRole) => {
    setRoleState(r);
    try {
      localStorage.setItem(STORAGE_KEY, r);
    } catch {
      /* private browsing */
    }
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
