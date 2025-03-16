'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        isDarkMode: false,
        themeMode: 'system',
        toggleTheme: () => {
          const currentMode = get().themeMode;
          if (currentMode === 'light') {
            set({ isDarkMode: true, themeMode: 'dark' });
          } else if (currentMode === 'dark') {
            set({ isDarkMode: false, themeMode: 'light' });
          } else {
            // If system, toggle to explicit light/dark based on current state
            set({
              isDarkMode: !get().isDarkMode,
              themeMode: get().isDarkMode ? 'light' : 'dark'
            });
          }
        },
        setDarkMode: (isDark: boolean) => set({
          isDarkMode: isDark,
          // Keep themeMode in sync
          themeMode: isDark ? 'dark' : 'light'
        }),
        setThemeMode: (mode: ThemeMode) => {
          // When setting to system, determine dark mode based on system preference
          if (mode === 'system' && typeof window !== 'undefined') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            set({ themeMode: mode, isDarkMode: systemPrefersDark });
          } else {
            set({ themeMode: mode, isDarkMode: mode === 'dark' });
          }
        },
      }),
      {
        name: 'theme-storage',
        partialize: (state) => ({
          isDarkMode: state.isDarkMode,
          themeMode: state.themeMode
        }),
      }
    ),
    {
      name: 'Theme Store',
      enabled: process.env.NODE_ENV === 'development',
      maxAge: process.env.NODE_ENV === 'development' ? 50 : 0
    }
  )
);
