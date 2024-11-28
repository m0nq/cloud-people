'use client';
import { useEffect } from 'react';
import type { Metadata } from 'next';
import { lexend } from '@lib/fonts';

export const metadata: Metadata = {
    title: 'Monk Wellington',
    description: 'Monk Wellington is a front-end web developer based in the San Francisco Bay Area.'
};

const GlobalError = ({ error, reset }: { error: Error; reset: () => void }) => {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <html lang="en" className={`${lexend.variable} font-sans`}>
            <body>
                <main className="h-full flex flex-col items-center justify-center">
                    <h2 className="text-center">Something went wrong!</h2>
                    <button onClick={() => reset()} className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400">
                        ↩ Whoa... Something weird happened. Try again?
                    </button>
                </main>
            </body>
        </html>
    );
};

export default GlobalError;
