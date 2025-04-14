/**
 * User Service Provider
 *
 * This module provides real and mock implementations for user authentication and profile management.
 */

import { User, UserResponse } from '@supabase/supabase-js';
import { createServiceProvider } from '.';
import { createBrowserClient } from '@lib/supabase/client';

// Define the interface for our user service
export interface UserService {
    // Authentication methods
    getCurrentUser(): Promise<User | null>;

    signIn(email: string, password: string): Promise<UserResponse>;

    signOut(): Promise<void>;

    // User profile methods
    getUserProfile(userId: string): Promise<any>;

    updateUserProfile(userId: string, data: any): Promise<any>;

    // Agents and workflows
    getAgents(): Promise<any[]>;

    getUserWorkflows(): Promise<any[]>;

    // Auth state
    isAuthenticated: boolean;
    isLoading: boolean;
}

/**
 * Real user service implementation that connects to Supabase
 */
class RealUserService implements UserService {
    private supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    isAuthenticated = false;
    isLoading = true;

    constructor() {
        // Initialize auth state
        this.refreshAuthState();
    }

    private async refreshAuthState() {
        try {
            const user = await this.getCurrentUser();
            this.isAuthenticated = !!user;
        } catch (error) {
            console.error('Error refreshing auth state:', error);
            this.isAuthenticated = false;
        } finally {
            this.isLoading = false;
        }
    }

    async getCurrentUser(): Promise<User | null> {
        try {
            const { data } = await this.supabase.auth.getUser();
            return data.user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    async signIn(email: string, password: string): Promise<UserResponse> {
        this.isLoading = true;
        try {
            const response = await this.supabase.auth.signInWithPassword({ email, password });
            await this.refreshAuthState();
            return response;
        } finally {
            this.isLoading = false;
        }
    }

    async signOut(): Promise<void> {
        this.isLoading = true;
        try {
            await this.supabase.auth.signOut();
            await this.refreshAuthState();
        } finally {
            this.isLoading = false;
        }
    }

    async getUserProfile(userId: string): Promise<any> {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    async updateUserProfile(userId: string, profileData: any): Promise<any> {
        const { data, error } = await this.supabase
            .from('profiles')
            .update(profileData)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getAgents(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('Agents')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getUserWorkflows(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('workflows')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
}

/**
 * Mock user service implementation that simulates authentication and database operations
 */
class MockUserService implements UserService {
    // Mock user data
    private mockUser: User = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'dev@cloudpeople.ai',
        user_metadata: {
            username: 'devuser',
            first_name: 'Development',
            last_name: 'User'
        },
        app_metadata: {
            subscription_plan: 'pro'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated'
    } as User;

    // Mock agents data
    private mockAgents = [
        {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Research Agent',
            description: 'Performs research tasks and collects information',
            created_by: this.mockUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            agent_speed: 'Fast',
            memory_limit: '4GB',
            budget: 10.00,
            models: 'gemini-2.0-flash'
        },
        {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Data Processing Agent',
            description: 'Processes and analyzes data from various sources',
            created_by: this.mockUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            agent_speed: 'Instant',
            memory_limit: '2GB',
            budget: 5.00,
            models: 'gemini-2.0-flash'
        }
    ];

    // Mock workflows data
    private mockWorkflows = [
        {
            id: '33333333-3333-3333-3333-333333333333',
            user_id: this.mockUser.id,
            state: 'INITIAL',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            data: {}
        }
    ];

    // Mock profile data
    private mockProfile = {
        id: this.mockUser.id,
        username: 'devuser',
        first_name: 'Development',
        last_name: 'User',
        subscription_plan: 'pro',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    isAuthenticated = true;
    isLoading = false;

    constructor() {
        console.log('[MockUserService] Initialized with mock user:', this.mockUser.email);
    }

    async getCurrentUser(): Promise<User | null> {
        // Simulate API delay
        await this.delay(100);
        console.log('[MockUserService] Returning mock user');
        return this.mockUser;
    }

    async signIn(email: string, password: string): Promise<UserResponse> {
        // Simulate API delay
        await this.delay(500);
        console.log(`[MockUserService] Mock sign in for: ${email}`);

        return {
            data: { user: this.mockUser, session: null },
            error: null
        } as UserResponse;
    }

    async signOut(): Promise<void> {
        // Simulate API delay
        await this.delay(300);
        console.log('[MockUserService] Mock sign out');
    }

    async getUserProfile(userId: string): Promise<any> {
        // Simulate API delay
        await this.delay(200);
        console.log(`[MockUserService] Getting profile for user: ${userId}`);
        return this.mockProfile;
    }

    async updateUserProfile(userId: string, profileData: any): Promise<any> {
        // Simulate API delay
        await this.delay(300);
        console.log(`[MockUserService] Updating profile for user: ${userId}`, profileData);

        // Update the mock profile with the new data
        this.mockProfile = { ...this.mockProfile, ...profileData, updated_at: new Date().toISOString() };
        return this.mockProfile;
    }

    async getAgents(): Promise<any[]> {
        // Simulate API delay
        await this.delay(300);
        console.log('[MockUserService] Returning mock agents:', this.mockAgents);
        return this.mockAgents;
    }

    async getUserWorkflows(): Promise<any[]> {
        // Simulate API delay
        await this.delay(300);
        console.log('[MockUserService] Returning mock workflows:', this.mockWorkflows);
        return this.mockWorkflows;
    }

    // Helper to simulate API delays
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create and export the user service with automatic mode switching
export const userService = createServiceProvider<UserService>(
    new RealUserService(),
    new MockUserService(),
    {
        // Default to real in production, mock in development
        defaultMode: process.env.NODE_ENV === 'production' ? 'real' : 'mock'
    }
);

// Export a hook for accessing the user service
export function useUserService() {
    return userService;
}
