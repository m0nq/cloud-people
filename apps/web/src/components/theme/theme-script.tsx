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
        const storedThemeData = localStorage.getItem('theme-storage');
        let isDark = false;
        
        if (storedThemeData) {
          try {
            const themeData = JSON.parse(storedThemeData);
            isDark = themeData.state?.isDarkMode === true;
          } catch (parseError) {
            console.error('Error parsing theme data:', parseError);
          }
        } else {
          // If no stored theme, check system preference
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          isDark = systemPrefersDark;
        }
        
        // Apply the theme by adding or removing the 'dark' class
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // Store the applied theme for debugging
        window.__THEME_APPLIED = isDark ? 'dark' : 'light';

        // Add a small delay and check again to ensure theme is applied
        setTimeout(() => {
          const storedThemeData = localStorage.getItem('theme-storage');
          let shouldBeDark = false;
          
          if (storedThemeData) {
            try {
              const themeData = JSON.parse(storedThemeData);
              shouldBeDark = themeData.state?.isDarkMode === true;
            } catch (parseError) {
              console.error('Error parsing theme data:', parseError);
            }
          } else {
            // If no stored theme, check system preference
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            shouldBeDark = systemPrefersDark;
          }
          
          if (shouldBeDark && !document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.add('dark');
            console.log('Theme re-applied: dark');
          } else if (!shouldBeDark && document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            console.log('Theme re-applied: light');
          }
        }, 0);
      } catch (e) {
        // Fallback to light mode if localStorage is not available
        console.error('Error applying theme:', e);
        document.documentElement.classList.remove('dark');
      }
    })();
  `;

  // Return a script element with the theme script
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};
