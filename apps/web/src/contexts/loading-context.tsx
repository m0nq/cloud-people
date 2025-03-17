'use client';

import { ReactNode } from 'react';
import { createContext } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';

import { LoadingSpinner } from '@components/spinners/loading-spinner';

type LoadingContextType = {
    isLoading: boolean;
    setLoading: (isLoading: boolean) => void;
    showLoader: () => void;
    hideLoader: () => void;
};

const LoadingContext = createContext<LoadingContextType>({
    isLoading: false,
    setLoading: () => {},
    showLoader: () => {},
    hideLoader: () => {}
});

interface LoadingProviderProps {
    children: ReactNode;
}

export const LoadingProvider = ({ children }: LoadingProviderProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingTimestamp, setLoadingTimestamp] = useState<number | null>(null);

    const setLoading = (loading: boolean) => {
        if (loading) {
            setLoadingTimestamp(Date.now());
        } else {
            // Only hide the loader if it's been visible for at least 500ms
            // This prevents flickering for very fast operations
            if (loadingTimestamp) {
                const timeElapsed = Date.now() - loadingTimestamp;
                if (timeElapsed < 500) {
                    setTimeout(() => {
                        setIsLoading(false);
                        setLoadingTimestamp(null);
                    }, 500 - timeElapsed);
                    return;
                }
            }
            setIsLoading(false);
            setLoadingTimestamp(null);
        }
        setIsLoading(loading);
    };

    const showLoader = () => {
        setLoading(true);
    };

    const hideLoader = () => {
        setLoading(false);
    };

    // Clean up any pending timeouts when the component unmounts
    useEffect(() => {
        return () => {
            setIsLoading(false);
            setLoadingTimestamp(null);
        };
    }, []);

    return (
        <LoadingContext.Provider
            value={{
                isLoading,
                setLoading,
                showLoader,
                hideLoader
            }}>
            {children}
            {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <LoadingSpinner size={48} color="text-blue-600" className="drop-shadow-lg" />
                </div>
            )}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => useContext(LoadingContext);
