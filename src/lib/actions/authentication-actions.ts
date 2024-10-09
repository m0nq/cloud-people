'use server';

import { redirect } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { createClient } from '@lib/supabase/server';

export const isLoggedIn = async () => {
    const supabase = createClient();

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
        redirect('/login');
    }
};

export const loginOrSignUp = async (formData: FormData) => {
    const origin = headers().get('origin');
    const supabase = createClient();
    const email = DOMPurify.sanitize(formData.get('email') as string);
    // const agreement = DOMPurify.sanitize(formData.get('agreement') as string);

    // TODO: uncomment when agreement policy is in place
    // if (!agreement) {
    //     return redirect('/login?message=You need to agree to our terms and conditions');
    // }

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${origin}/auth/callback`
        }
    });

    if (error) {
        redirect('/login?message=Could not authenticate user');
    }

    redirect('/login?message=Check your email to continue logging in');
};

export const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'local' });
    revalidatePath('/', 'layout');
    redirect('/login');
};

