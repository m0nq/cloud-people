'use client';

import { useEffect } from 'react';
import { useState } from 'react';
import { useMemo } from 'react';

import { createClient } from '@lib/supabase/client';
import { signOut } from '@lib/actions/authentication-client-actions';
import { useUser } from '@contexts/user-context';

type AuthButtonProps = {
    formAction: string | ((formData: FormData) => void) | undefined;
    buttonType: 'submit' | 'reset' | 'button' | undefined;
    className?: string;
};

export const AuthenticationButton = ({ formAction, buttonType, className }: AuthButtonProps) => {
    const { user, isLoading, usingMockService } = useUser();
    const [supabaseUser, setSupabaseUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Memoize the supabase auth object to prevent infinite rerenders
    const supabaseAuth = useMemo(() => supabase.auth, [supabase]);

    // Only fetch from Supabase if we're not using the mock service
    useEffect(() => {
        // Skip Supabase auth if we're using mock service
        if (usingMockService) {
            setLoading(false);
            return;
        }

        const getUser = async () => {
            try {
                const { data: { user } } = await supabaseAuth.getUser();
                setSupabaseUser(user);
            } catch (error) {
                console.error('Error fetching user:', error);
            } finally {
                setLoading(false);
            }
        };

        getUser();

        const { data: { subscription } } = supabaseAuth.onAuthStateChange((_event, session) => {
            setSupabaseUser(session?.user ?? null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabaseAuth, usingMockService]);

    // Use either the user from context (for mock) or from Supabase (for real auth)
    const currentUser = usingMockService ? user : supabaseUser;
    const isUserLoading = usingMockService ? isLoading : loading;

    if (isUserLoading) {
        return null; // Or a loading spinner
    }

    return currentUser ? (
        <div className="flex items-center gap-4">
            Hey, {currentUser.email}!
            <button formAction={signOut} className={className}>
                Logout
            </button>
        </div>
    ) : (
        <button formAction={formAction} type={buttonType} className={className}>
            Sign up / Login
        </button>
    );
};
