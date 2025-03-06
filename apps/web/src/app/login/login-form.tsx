'use client';

import { ReactNode } from 'react';
import { useState } from 'react';

import { AuthenticationButton } from '@components/utils/auth-button/auth-button';
import { SocialLoginButton } from '@components/utils/social-login/social-login-button';
import { loginOrSignUp } from '@lib/actions/authentication-actions';

import { ThemeToggle } from './theme-toggle';

interface LoginFormProps {
    message?: string;
}

export const LoginForm = ({ message }: LoginFormProps): ReactNode => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        try {
            setIsLoading(true);
            await loginOrSignUp(email);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <ThemeToggle />
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <div className="text-center" role="banner">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome to The Rebellion</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Enter your credentials to access your dashboard</p>
                </div>

            {/* Social login buttons */}
                <div className="mt-6" role="region" aria-label="Social login options">
                <SocialLoginButton
                    provider="google"
                    label="Continue with Google"
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#56E8CD] transition-colors duration-200"
                    icon={
                        <svg 
                            className="h-5 w-5" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                            role="img"
                        >
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    }
                />
            </div>

            {/* Divider */}
                <div 
                    className="mt-6 relative" 
                    role="separator" 
                    aria-label="Or continue with email"
                >
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            Or continue with email
                        </span>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
                {(message || error) && (
                    <div 
                        className="rounded-md bg-red-50 dark:bg-red-900/50 p-4" 
                        role="alert"
                        aria-live="polite"
                    >
                        <p className="text-sm text-red-700 dark:text-red-200">{error || message}</p>
                    </div>
                )}

                <div className="rounded-md shadow-sm space-y-4">
                    <div className="space-y-1">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-[#56E8CD] focus:border-[#56E8CD] focus:z-10 sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                            placeholder="Enter your email"
                            aria-label="Email address"
                            aria-invalid={!!error}
                            aria-describedby={error ? "email-error" : undefined}
                        />
                </div>

                <div className="mt-6 relative">
                    {isLoading && (
                        <div 
                            className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-md"
                            role="status"
                            aria-label="Loading"
                        >
                            <div 
                                className="w-5 h-5 border-2 border-[#56E8CD] border-t-transparent rounded-full animate-spin"
                                aria-hidden="true"
                            ></div>
                        </div>
                    )}
                    <AuthenticationButton
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#56E8CD] hover:bg-[#56E8CD]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#56E8CD] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        formAction={loginOrSignUp}
                        buttonType="submit"
                        disabled={isLoading}
                    />
                </div>
                </form>
            </div>
        </div>
    );
};
