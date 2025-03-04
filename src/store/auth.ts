import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  } | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithSocial: (provider: 'google' | 'apple' | 'x') => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  login: async (email: string, password: string) => {
    // In a real app, this would be an API call
    if (email && password) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      set({
        isAuthenticated: true,
        user: {
          id: '1',
          name: 'John Doe',
          email,
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
      });
    }
  },
  loginWithSocial: async (provider: 'google' | 'apple' | 'x') => {
    // In a real app, this would redirect to the OAuth provider
    // For demo purposes, we'll simulate a successful login
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Generate a fake email based on the provider
    const email = `user@${provider}.com`;
    
    // Generate a name based on the provider
    let name = 'John Doe';
    if (provider === 'google') name = 'Google User';
    if (provider === 'apple') name = 'Apple User';
    if (provider === 'x') name = 'X User';
    
    set({
      isAuthenticated: true,
      user: {
        id: `${provider}-1`,
        name,
        email,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    });
  },
  logout: () => {
    set({ isAuthenticated: false, user: null });
  },
}));