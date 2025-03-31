'use server';
import { redirect } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { User } from '@supabase/supabase-js';
import { type Provider } from '@supabase/supabase-js';

import { createClient } from '@lib/supabase/server';
import { Config } from '@config/constants';

const { API: { EndPoints } } = Config;

// Mock user for development mode
const DEV_USER: User = {
    id: 'dev-user-id',
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
    // Skip authentication check in development mode
    if (process.env.NODE_ENV === 'development') {
        return;
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
        redirect(EndPoints.Login);
    }
};

export const loginWithOAuth = async (provider: Provider) => {
    // In development mode, redirect to home page
    if (process.env.NODE_ENV === 'development') {
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
    // In development mode, redirect to home page
    if (process.env.NODE_ENV === 'development') {
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
    // In development mode, redirect to login page
    if (process.env.NODE_ENV === 'development') {
        redirect(EndPoints.Login);
    }

    const supabase = await createClient();
    await supabase.auth.signOut({ scope: 'local' });
    revalidatePath(EndPoints.Home, 'layout');
    redirect(EndPoints.Login);
};

export const authCheck = async (): Promise<User> => {
    // Return mock user in development mode
    if (process.env.NODE_ENV === 'development') {
        return DEV_USER;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    return user;
};

export const refreshSession = async () => {
    // Skip in development mode
    if (process.env.NODE_ENV === 'development') {
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
