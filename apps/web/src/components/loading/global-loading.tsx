'use client';

import { ReactElement } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';

import { LoadingSpinner } from '@components/spinners/loading-spinner';

interface GlobalLoadingProps {
    isLoading?: boolean;
    fullScreen?: boolean;
    zIndex?: number;
    spinnerSize?: number;
    spinnerColor?: string;
    backgroundColor?: string;
    opacity?: number;
}

/**
 * A global loading overlay component that can be used to show a loading state
 * across the entire application or within a specific container.
 */
export const GlobalLoading = ({
    isLoading = false,
    fullScreen = true,
    zIndex = 50,
    spinnerSize = 48,
    spinnerColor = 'text-blue-600',
    backgroundColor = 'bg-black',
    opacity = 50
}: GlobalLoadingProps): ReactElement | null => {
    const [show, setShow] = useState(isLoading);

    useEffect(() => {
        // Small delay to prevent flickering for very fast operations
        if (isLoading) {
            setShow(true);
        } else {
            const timer = setTimeout(() => setShow(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    if (!show) return null;

    return (
        <div className={`${fullScreen ? 'fixed inset-0' : 'absolute inset-0'} flex items-center justify-center ${backgroundColor} bg-opacity-${opacity} z-${zIndex}`}
            role="status"
            aria-live="polite"
            data-testid="global-loading">
            <LoadingSpinner
                size={spinnerSize}
                color={spinnerColor}
                className="drop-shadow-lg" />
        </div>
    );
};
