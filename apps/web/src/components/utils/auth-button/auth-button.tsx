'use client';

import { useEffect } from 'react';
import { useState } from 'react';
import { useMemo } from 'react';

import { createClient } from '@lib/supabase/client';
import { signOut } from '@lib/actions/authentication-actions';

type AuthButtonProps = {
    formAction: string | ((formData: FormData) => void) | undefined;
    buttonType: 'submit' | 'reset' | 'button' | undefined;
    className?: string;
};

export const AuthenticationButton = ({ formAction, buttonType, className }: AuthButtonProps) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Memoize the supabase auth object to prevent infinite rerenders
    const supabaseAuth = useMemo(() => supabase.auth, [supabase]);

    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: { user } } = await supabaseAuth.getUser();
                setUser(user);
            } catch (error) {
                console.error('Error fetching user:', error);
            } finally {
                setLoading(false);
            }
        };

        getUser();

        const { data: { subscription } } = supabaseAuth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabaseAuth]);

    if (loading) {
        return null; // Or a loading spinner
    }

    return user ? (
        <div className="flex items-center gap-4">
            Hey, {user.email}!
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
