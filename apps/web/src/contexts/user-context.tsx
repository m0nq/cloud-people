'use client';

import { createContext } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { User } from '@supabase/supabase-js';

import { getGlobalServiceProviderMode } from '@lib/service-providers';
import { setGlobalServiceProviderMode } from '@lib/service-providers';
import type { ProviderMode } from '@lib/service-providers';
import { userService } from '@lib/service-providers/user-service';

// Define the context type
type UserContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  getAgents: () => Promise<any[]>;
  getUserWorkflows: () => Promise<any[]>;
  signOut: () => Promise<void>;
  usingMockService: boolean;
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
  usingMockService: false,
  toggleServiceMode: () => { }
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // State for service mode, initialized from the global state
  const [usingMockService, setUsingMockService] = useState(() => {
    // Read the initial mode determined by the service provider logic
    return getGlobalServiceProviderMode() === 'mock';
  });

  // Function to toggle the global service mode and update local state
  const toggleServiceMode = () => {
    const newMode: ProviderMode = usingMockService ? 'real' : 'mock';
    // Update the global state (this also updates localStorage and notifies proxies)
    setGlobalServiceProviderMode(newMode);
    // Update the local React state to trigger re-render of consumers
    setUsingMockService(newMode === 'mock');
  };

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
      console.error('Error getting agents:', error instanceof Error ? error.message : JSON.stringify(error));
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
