'use server';
import { redirect } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { User } from '@supabase/supabase-js';
import { type Provider } from '@supabase/supabase-js';

import { createClient } from '@lib/supabase/server';
import { Config } from '@config/constants';
import defaultUser from '@lib/supabase/default-user.json';

const { API: { EndPoints } } = Config;
const isDevelopment = process.env.NODE_ENV === 'development';

export const isLoggedIn = async () => {
    if (!isDevelopment) {
        const supabase = await createClient();

        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
            redirect(EndPoints.Login);
        }
    }
};

export const loginWithOAuth = async (provider: Provider) => {
    if (!isDevelopment) {
        const redirectTo = `${(await headers()).get('origin') ?? 'http://localhost:3000'}/auth/callback`;
        const supabase = await createClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo
            }
        });

        if (data.url) {
            redirect(data.url); // use the redirect API for your server framework
        }
    }
};

export const loginOrSignUp = async (formData: FormData) => {
    if (!isDevelopment) {
        const emailRedirectTo = (await headers()).get('origin') ?? '/';
        const supabase = await createClient();
        const email = DOMPurify.sanitize(formData.get('email') as string);
        // const agreement = DOMPurify.sanitize(formData.get('agreement') as string);

        // TODO: uncomment when agreement policy is in place
        // if (!agreement) {
        //     return redirect('/login?message=You need to agree to our terms and conditions');
        // }

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo
            }
        });

        if (error) {
            redirect(`${EndPoints.Login}?message=Could not authenticate user`);
        }

        redirect(`${EndPoints.Login}?message=Check your email to continue logging in`);
    }
};

export const signOut = async () => {
    if (!isDevelopment) {
        const supabase = await createClient();
        await supabase.auth.signOut({ scope: 'local' });
        revalidatePath(EndPoints.Home, 'layout');
        redirect(EndPoints.Login);
    }
};

export const authCheck = async (): Promise<User> => {
    if (isDevelopment) {
        // Return a mock user for development
        return defaultUser as User;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    return user;
};

export const refreshSession = async () => {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        throw new Error('Session refresh failed');
    }

    return session;
};
