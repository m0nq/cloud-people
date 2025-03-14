'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        isDarkMode: false,
        toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
        setDarkMode: (isDark: boolean) => set({ isDarkMode: isDark }),
      }),
      {
        name: 'theme-storage',
      }
    ),
    {
      name: 'Theme Store',
      enabled: process.env.NODE_ENV === 'development',
      maxAge: process.env.NODE_ENV === 'development' ? 50 : 0
    }
  )
);
