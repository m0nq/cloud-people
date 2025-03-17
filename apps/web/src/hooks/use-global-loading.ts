'use client';

import { useLoading } from '@contexts/loading-context';

/**
 * A hook that provides access to the global loading state.
 *
 * @returns An object with methods to control the global loading state
 * - isLoading: boolean - Current loading state
 * - setLoading: (loading: boolean) => void - Set loading state
 * - showLoader: () => void - Show the loader
 * - hideLoader: () => void - Hide the loader
 * - withLoading: <T>(promise: Promise<T>) => Promise<T> - Utility to show loader during promise execution
 */
export const useGlobalLoading = () => {
    const { isLoading, setLoading, showLoader, hideLoader } = useLoading();

    /**
     * Utility function to show loading during a promise execution
     * and automatically hide it when the promise resolves or rejects
     */
    const withLoading = async <T>(promise: Promise<T>): Promise<T> => {
        try {
            showLoader();
            return await promise;
        } finally {
            hideLoader();
        }
    };

    return {
        isLoading,
        setLoading,
        showLoader,
        hideLoader,
        withLoading
    };
};
