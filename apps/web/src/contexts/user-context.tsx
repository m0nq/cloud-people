'use client';

import { createContext } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { userService } from '@lib/service-providers/user-service';

// Define the context type
type UserContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  getAgents: () => Promise<any[]>;
  getUserWorkflows: () => Promise<any[]>;
  signOut: () => Promise<void>;
  // Add a property to indicate if we're using mock or real service
  usingMockService: boolean;
  // Add a method to toggle between real and mock services
  toggleServiceMode: () => void;
};

// Create the context with default values
const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  getAgents: () => Promise.resolve([]),
  getUserWorkflows: () => Promise.resolve([]),
  signOut: () => Promise.resolve(),
  usingMockService: false, // Default initial value
  toggleServiceMode: () => { }
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // State for service mode, initialized based on server default, but updated client-side
  const [usingMockService, setUsingMockService] = useState(() => {
    // Initial value respects server-determined mode if available, else defaults
    return userService._mode === 'mock';
  });

  // Function to toggle between real and mock service modes
  const toggleServiceMode = () => {
    if (typeof window !== 'undefined') {
      const currentMode = localStorage.getItem('serviceProviderMode') || userService._mode;
      const newMode = currentMode === 'real' ? 'mock' : 'real';
      localStorage.setItem('serviceProviderMode', newMode);
      // Force a page refresh to apply the new mode globally
      window.location.reload();
    }
  };

  // Effect to synchronize state with localStorage on client-side load
  useEffect(() => {
    const storedMode = localStorage.getItem('serviceProviderMode');
    if (storedMode === 'real' || storedMode === 'mock') {
        console.log('[Client] Updating service mode from localStorage:', storedMode);
        setUsingMockService(storedMode === 'mock');
    } else {
        // If nothing in localStorage, ensure state matches the initial userService mode
        // This handles the very first load before localStorage is set.
        setUsingMockService(userService._mode === 'mock');
    }
  }, []); // Empty dependency array: runs only once on client mount

  // Load user on initial mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await userService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Get agents from the service
  const getAgents = async () => {
    try {
      return await userService.getAgents();
    } catch (error) {
      console.error('Error getting agents:', error);
      return [];
    }
  };

  // Get user workflows from the service
  const getUserWorkflows = async () => {
    try {
      return await userService.getUserWorkflows();
    } catch (error) {
      console.error('Error getting workflows:', error);
      return [];
    }
  };

  // Sign out and redirect to login
  const signOut = async () => {
    try {
      await userService.signOut();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      getAgents,
      getUserWorkflows,
      signOut,
      usingMockService,
      toggleServiceMode
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
