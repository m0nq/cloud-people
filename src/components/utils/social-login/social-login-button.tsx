'use client';
import { Provider } from '@supabase/supabase-js';
import { ReactNode } from 'react';

import { loginWithOAuth } from '@lib/actions/authentication-actions';

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
    return (
        <button onClick={() => loginWithOAuth(provider)} type={buttonType} className={className}>
            {children}
        </button>
    );
};
