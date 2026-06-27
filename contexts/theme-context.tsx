'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'night' | 'solar';

const STORAGE_KEY = 'vendorflow-theme';

const ThemeContext = createContext<{
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}>({ mode: 'solar', toggleMode: () => {}, setMode: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('solar');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === 'night' || saved === 'solar') setModeState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('night', 'solar');
    document.documentElement.classList.add(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = (m: ThemeMode) => setModeState(m);
  const toggleMode = () => setModeState(m => (m === 'night' ? 'solar' : 'night'));

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
