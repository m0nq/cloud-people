export const validateUrl = (url: string): URL | null => {
    try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl : null;
    } catch {
        return null;
    }
};

/**
 * Navigate to a URL using a browser instance via the browser automation API
 * @param url The URL to navigate to
 * @param onProgress Optional callback for progress updates
 */
export const navigateToUrl = async (
    url: string,
    onProgress?: (progress: number) => void
): Promise<void> => {
    try {
        // Initial progress update
        onProgress?.(10);

        // Validate URL
        const validUrl = validateUrl(url);
        if (!validUrl) {
            throw new Error('Invalid URL');
        }

        // Call browser automation API
        const response = await fetch('/api/browser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: validUrl.toString() })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Navigation failed');
        }

        // Complete progress
        onProgress?.(100);
    } catch (error) {
        console.error('Navigation error:', error);
        throw error;
    }
};
