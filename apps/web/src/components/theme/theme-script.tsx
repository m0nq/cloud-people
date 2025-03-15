'use client';

import { ReactElement } from 'react';

/**
 * This component injects a script into the head of the document that reads the theme
 * from localStorage and applies the dark class to the html element before the page renders.
 * This prevents the flash of light theme when the page loads with dark mode enabled.
 */
export const ThemeScript = (): ReactElement => {
  // This script will run before the page renders and hydration occurs
  return (
    <script
      id="theme-script"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              // Check if we have a theme preference stored
              const storedTheme = localStorage.getItem('theme-storage');
              
              if (storedTheme) {
                const themeData = JSON.parse(storedTheme);
                
                // Apply dark mode if the stored preference is dark
                if (themeData.state && themeData.state.isDarkMode) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } else {
                // If no stored preference, check system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                  document.documentElement.classList.add('dark');
                }
              }
            } catch (e) {
              // If there's an error, do nothing
              console.error('Error applying theme:', e);
            }
          })();
        `,
      }}
    />
  );
};
