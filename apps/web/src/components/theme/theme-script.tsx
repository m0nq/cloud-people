import { FC } from 'react';

/**
 * ThemeScript component that injects a script into the head of the document
 * to apply the correct theme before React hydration, preventing flash of light mode
 * when dark mode is toggled on during loading.
 */
export const ThemeScript: FC = () => {
  // This script runs before React hydration to ensure the correct theme is applied
  const themeScript = `
    (function() {
      try {
        // Get the stored theme from localStorage
        const storedTheme = localStorage.getItem('theme');
        // Get the system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Determine which theme to apply
        const isDark = 
          storedTheme === 'dark' || 
          (storedTheme === 'system' && systemPrefersDark) || 
          (!storedTheme && systemPrefersDark);
        
        // Apply the theme by adding or removing the 'dark' class
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        // Fallback if localStorage is not available
        console.error('Error applying theme:', e);
      }
    })();
  `;

  // Return a script element with the theme script
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};
