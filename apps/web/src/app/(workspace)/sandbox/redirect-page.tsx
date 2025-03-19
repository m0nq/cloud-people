'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SandboxSkeleton } from '@components/skeletons/skeletons';

// This page is kept for backward compatibility and redirects to the new Canvas page
export default function SandboxRedirect(): ReactNode {
    const router = useRouter();
    
    useEffect(() => {
        // Short timeout to ensure the redirect happens after the component mounts
        const redirectTimeout = setTimeout(() => {
            router.replace('/canvas');
        }, 100);
        
        return () => clearTimeout(redirectTimeout);
    }, [router]);
    
    // Show a skeleton while redirecting
    return <SandboxSkeleton />;
}
