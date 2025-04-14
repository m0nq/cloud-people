'use client';
import { Provider } from '@supabase/supabase-js';
import { ReactNode } from 'react';
import { useState } from 'react';

import { useUser } from '@contexts/user-context';

type SocialLoginButtonProps = {
    provider: Provider;
    buttonType?: 'submit' | 'reset' | 'button' | undefined;
    className?: string;
    children: ReactNode;
};

export const SocialLoginButton = ({
    provider,
    buttonType = 'button',
    className = '',
    children
}: SocialLoginButtonProps) => {
    const { usingMockService } = useUser();
    const [isLoading, setIsLoading] = useState(false);

    // Handle the social login click
    const handleSocialLogin = async () => {
        if (isLoading) return;

        setIsLoading(true);

        try {
            if (usingMockService) {
                // If using mock service, redirect to home page
                window.location.href = '/';
            } else {
                // For real OAuth login, use our API route
                const response = await fetch('/api/auth/oauth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        provider: provider
                    })
                });

                const data = await response.json();

                if (response.ok && data.url) {
                    // Redirect to the OAuth provider
                    window.location.href = data.url;
                } else {
                    console.error('OAuth error:', data.error);
                    alert('Failed to initiate login. Please try again.');
                }
            }
        } catch (error) {
            console.error('Error during social login:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleSocialLogin}
            type={buttonType}
            className={className}
            disabled={isLoading}>
            {isLoading ? 'Loading...' : children}
        </button>
    );
};
