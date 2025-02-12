import { chromium } from '@playwright/test';

export const validateUrl = (url: string): URL | null => {
    try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl : null;
    } catch {
        return null;
    }
};

/**
 * Navigate to a URL using a browser instance
 * @param url The URL to navigate to
 * @param onProgress Optional callback for progress updates
 */
export const navigateToUrl = async (url: string, onProgress?: (progress: number) => void): Promise<void> => {
    try {
        // Simulate progress for UX feedback
        onProgress?.(10);
        
        const response = await fetch('/api/agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Navigate to Google' }],
                action: 'navigate_to_google',
                parameters: { url },
                agentId: 'browser_navigation'
            }),
        });

        onProgress?.(50);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Navigation failed');
        }

        const data = await response.json();
        if (!data.success || data.error) {
            throw new Error(data.error || 'Navigation failed');
        }

        onProgress?.(100);
    } catch (error) {
        console.error('Navigation error:', error);
        throw error;
    }
};
