'use server';

/**
 * Supabase Authentication Action
 *
{{ ... }}
 */

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import DOMPurify from 'isomorphic-dompurify';
import { User } from '@supabase/supabase-js';
import { Provider } from '@supabase/supabase-js';

import { Config } from '@config/constants';
import { getEnvConfig } from '@lib/env';
import { createClient } from '@lib/supabase/server';

const { API: { EndPoints } } = Config;

// Get service mode from environment
const getServiceMode = () => {
    const env = getEnvConfig();
    // Check for explicit service mode override
    if (env.NEXT_PUBLIC_SERVICE_MODE === 'mock' || env.NEXT_PUBLIC_SERVICE_MODE === 'real') {
        return env.NEXT_PUBLIC_SERVICE_MODE;
    }
    // Default to mock in development, real in production
    return process.env.NODE_ENV === 'development' ? 'mock' : 'real';
};

// Mock user for development mode - using a valid UUID format
const DEV_USER: User = {
    id: '00000000-0000-0000-0000-000000000000', // Valid UUID format
    email: 'dev@example.com',
    user_metadata: {
        full_name: 'Development User',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    app_metadata: {
        provider: 'development',
        role: 'admin'
    },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString()
};

export const isLoggedIn = async () => {
    // Skip authentication check in mock mode
    if (getServiceMode() === 'mock') {
        return;
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
        redirect(EndPoints.Login);
    }
};

export const loginWithOAuth = async (provider: Provider) => {
    // In mock mode, redirect to home page
    if (getServiceMode() === 'mock') {
        redirect(EndPoints.Home);
    }

    const redirectTo = `${(await headers()).get('origin') ?? 'http://localhost:3000'}/auth/callback`;
    const supabase = await createClient();
    // const agreement = DOMPurify.sanitize(formData.get('agreement') as string);

    // TODO: uncomment when agreement policy is in place
    // if (!agreement) {
    //     return redirect('/login?message=You need to agree to our terms and conditions');
    // }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo
        }
    });

    if (data.url) {
        redirect(data.url); // use the redirect API for your server framework
    }
};

export const loginOrSignUp = async (formData: FormData) => {
    // In mock mode, redirect to home page
    if (getServiceMode() === 'mock') {
        redirect(EndPoints.Home);
    }

    const emailRedirectTo = (await headers()).get('origin') ?? 'http://localhost:3000';
    const supabase = await createClient();
    const email = DOMPurify.sanitize(formData.get('email') as string);
    // const agreement = DOMPurify.sanitize(formData.get('agreement') as string);

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo,  // Let Supabase handle the full callback URL
            shouldCreateUser: true
        }
    });

    if (error) {
        console.log('Authentication failed', error);
        redirect(`${EndPoints.Login}?message=Could not authenticate user`);
    }

    redirect(`${EndPoints.Login}?message=Check your email to continue logging in`);
};

export const signOut = async () => {
    // In mock mode, redirect to login page
    if (getServiceMode() === 'mock') {
        redirect(EndPoints.Login);
    }

    const supabase = await createClient();
    await supabase.auth.signOut({ scope: 'local' });
    revalidatePath(EndPoints.Home, 'layout');
    redirect(EndPoints.Login);
};

export const authCheck = async (): Promise<User> => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    return user;
};

export const refreshSession = async () => {
    // Skip in mock mode
    if (getServiceMode() === 'mock') {
        return {
            access_token: 'dev-access-token',
            refresh_token: 'dev-refresh-token',
            expires_at: Date.now() + 3600 * 1000,
            user: DEV_USER
        };
    }

    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        throw new Error('Session refresh failed');
    }

    return session;
};
