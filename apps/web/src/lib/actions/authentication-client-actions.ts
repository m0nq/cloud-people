'use client';

import type { Provider } from '@supabase/supabase-js';
import {
	loginWithOAuth as serverLoginWithOAuth,
	loginOrSignUp as serverLoginOrSignUp,
	signOut as serverSignOut,
} from './authentication-actions';

/**
 * Client-safe wrapper to initiate OAuth login.
 * Calls the server action `loginWithOAuth`.
 * @param provider The OAuth provider.
 */
export const loginWithOAuth = async (provider: Provider): Promise<void> => {
	await serverLoginWithOAuth(provider);
};

/**
 * Client-safe wrapper to initiate email OTP login/signup.
 * Calls the server action `loginOrSignUp`.
 * @param formData The form data containing the email.
 */
export const loginOrSignUp = async (formData: FormData): Promise<void> => {
	await serverLoginOrSignUp(formData);
};

/**
 * Client-safe wrapper to sign the user out.
 * Calls the server action `signOut`.
 */
export const signOut = async (): Promise<void> => {
	await serverSignOut();
};

export {}; // Placeholder to make it a module
