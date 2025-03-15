'use client';

import { ReactNode } from 'react';
import { useEffect } from 'react';

import { useThemeStore } from '../../stores/theme-store';

interface ClientThemeProviderProps {
  children: ReactNode;
}

/**
 * Client-side theme provider that syncs the theme state with the DOM
 * and handles system preference changes.
 */
export const ClientThemeProvider = ({ children }: ClientThemeProviderProps) => {
  const { isDarkMode } = useThemeStore();

  // Apply dark mode class to the document whenever the theme state changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check system preference on initial load and set up listener for changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent): void => {
      const newIsDark = e.matches;
      useThemeStore.getState().setDarkMode(newIsDark);
    };

    // Only set initial value if theme hasn't been explicitly set before
    const storedTheme = localStorage.getItem('theme-storage');
    if (!storedTheme) {
      useThemeStore.getState().setDarkMode(mediaQuery.matches);
    }

    // Listen for system preference changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return <>{children}</>;
};
