import React, { useEffect } from 'react';
import { Navbar } from './Navbar';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import { Navigate } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Toolbar } from '../ui/Toolbar';

interface LayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, requireAuth = true }) => {
  const { isAuthenticated } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  
  useEffect(() => {
    // Apply dark mode class to the document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} flex transition-colors duration-200`}>
      {isAuthenticated && <Navbar />}
      <main className="flex-1 p-0 ml-[116px] relative">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        {children}
        {isAuthenticated && <Toolbar />}
      </main>
    </div>
  );
};