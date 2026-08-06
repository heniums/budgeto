import { useContext } from 'react';
import { ThemeContext, type ThemeMode, type ResolvedTheme } from './ThemeProvider';

interface UseThemeReturn {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

export function useTheme(): UseThemeReturn {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
