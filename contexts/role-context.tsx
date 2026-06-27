'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
  const [role, setRoleState] = useState<UserRole>('public');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UserRole | null;
    if (saved === 'public' || saved === 'vendor' || saved === 'organizer') {
      setRoleState(saved);
    }
  }, []);

  const setRole = (r: UserRole) => {
    setRoleState(r);
    localStorage.setItem(STORAGE_KEY, r);
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
