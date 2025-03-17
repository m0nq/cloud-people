'use client';

import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { useEffect } from 'react';

import { useThemeStore } from '../../stores/theme-store';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps): ReactElement => {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    // Apply dark mode class to the document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check system preference on initial load
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent): void => {
      const newIsDark = e.matches;
      useThemeStore.getState().setDarkMode(newIsDark);
    };

    // Set initial value based on system preference if not already set in store
    if (useThemeStore.getState().isDarkMode === undefined) {
      useThemeStore.getState().setDarkMode(mediaQuery.matches);
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return <>{children}</>;
};
