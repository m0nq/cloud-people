'use client';
import { createContext } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define a mock user with necessary properties based on your Profiles schema
const mockUser = {
    id: '00000000-0000-0000-0000-000000000000', // A fixed UUID for development
    email: 'dev@cloudpeople.ai',
    username: 'devuser',
    first_name: 'Development',
    last_name: 'User',
    subscription_plan: 'pro', // Assuming you have a 'pro' plan
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

// Define the context type based on what your app expects
type MockUserContextType = {
    user: typeof mockUser;
    isLoading: boolean;
    isAuthenticated: boolean;
    getAgents: () => Promise<any[]>;
    getUserWorkflows: () => Promise<any[]>;
    signOut: () => Promise<void>;
};

// Create the context with default values
const MockUserContext = createContext<MockUserContextType>({
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
    getAgents: () => Promise.resolve([]),
    getUserWorkflows: () => Promise.resolve([]),
    signOut: () => Promise.resolve()
});

export const MockUserProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Simulate loading state briefly
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    // Mock agent data based on your schema
    const mockAgents = [
        {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Research Agent',
            description: 'Performs research tasks and collects information',
            created_by: mockUser.id,
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
            created_by: mockUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            agent_speed: 'Instant',
            memory_limit: '2GB',
            budget: 5.00,
            models: 'gemini-2.0-flash'
        }
    ];

    // Mock workflow data based on your schema
    const mockWorkflows = [
        {
            id: '33333333-3333-3333-3333-333333333333',
            user_id: mockUser.id,
            state: 'INITIAL',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            data: {}
        }
    ];

    // Mock functions that your application might use
    const getAgents = async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('[MockUserContext] Returning mock agents:', mockAgents);
        return mockAgents;
    };

    const getUserWorkflows = async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('[MockUserContext] Returning mock workflows:', mockWorkflows);
        return mockWorkflows;
    };

    const signOut = async () => {
        // Simulate sign out
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('[MockUserContext] Mock sign out');
        router.push('/login');
    };

    return (
        <MockUserContext.Provider value={{
            user: mockUser,
            isLoading,
            isAuthenticated: true,
            getAgents,
            getUserWorkflows,
            signOut
        }}>
            {children}
        </MockUserContext.Provider>
    );
};

export const useMockUser = () => useContext(MockUserContext);
