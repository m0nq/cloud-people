'use client';

import { ReactNode } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';

import { useThemeStore } from '@stores/theme-store';

interface ClientThemeProviderProps {
    children: ReactNode;
}

/**
 * Client-side theme provider that syncs the theme state with the DOM
 * and handles system preference changes.
 */
export const ClientThemeProvider = ({ children }: ClientThemeProviderProps) => {
    const { isDarkMode, setDarkMode } = useThemeStore();
    const [isInitialized, setIsInitialized] = useState(false);

    // Apply theme immediately on component mount, before any effects run
    if (typeof window !== 'undefined' && !isInitialized) {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Get theme from persisted state if available
        const storedThemeData = localStorage.getItem('theme-storage');
        let shouldBeDark = systemPrefersDark; // Default to system preference

        if (storedThemeData) {
            try {
                const themeData = JSON.parse(storedThemeData);
                shouldBeDark = themeData.state?.isDarkMode === true;
            } catch (parseError) {
                console.error('Error parsing theme data:', parseError);
            }
        }

        if (shouldBeDark !== isDarkMode) {
            setDarkMode(shouldBeDark);
        }

        setIsInitialized(true);
    }

    // Apply dark mode class to the document whenever the theme state changes
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Double-check after a small delay to ensure theme is applied
        const timer = setTimeout(() => {
            if (isDarkMode && !document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.add('dark');
            } else if (!isDarkMode && document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [isDarkMode]);

    // Check system preference on initial load and set up listener for changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent): void => {
            const newIsDark = e.matches;

            // Get the current theme setting
            const storedThemeData = localStorage.getItem('theme-storage');
            if (storedThemeData) {
                try {
                    const themeData = JSON.parse(storedThemeData);
                    // If we're using system theme, update based on system changes
                    if (themeData.state?.useSystemTheme) {
                        setDarkMode(newIsDark);
                    }
                } catch (parseError) {
                    console.error('Error parsing theme data:', parseError);
                }
            } else {
                // If no stored preference, follow system
                setDarkMode(newIsDark);
            }
        };

        // Listen for system preference changes
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [setDarkMode]);

    return <>{children}</>;
};
