export type TimeRange = 'Today' | 'Yesterday' | 'Recently' | string;

/**
 * Validates if a string is a valid ISO 8601 date
 * @param dateString - String to validate
 * @returns true if valid ISO 8601 date
 */
export const isValidISODate = (dateString: string): boolean => {
    if (!dateString) return false;
    
    // ISO 8601 regex pattern
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?$/;
    if (!isoDatePattern.test(dateString)) return false;
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
};

/**
 * Formats a date string into a relative time format
 * @param date - ISO 8601 date string
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: string): TimeRange => {
    // Validate date string format
    if (!isValidISODate(date)) {
        console.warn('[DateUtils] Invalid or missing date format:', { date });
        return 'Recently';
    }

    try {
        const lastUpdated = new Date(date);
        const now = new Date();
        const MS_PER_DAY = 1000 * 60 * 60 * 24;
        
        // Ensure we're comparing dates in UTC to avoid timezone issues
        const diffInDays = (now.getTime() - lastUpdated.getTime()) / MS_PER_DAY;
        
        // Handle different time ranges
        if (diffInDays < 0) {
            console.warn('[DateUtils] Future date detected:', { date, diffInDays });
            return 'Recently';
        }
        
        if (diffInDays < 1) {
            // Check if it's the same calendar day
            return now.toDateString() === lastUpdated.toDateString() ? 'Today' : 'Yesterday';
        }
        
        if (diffInDays < 2) {
            return 'Yesterday';
        }
        
        if (diffInDays > 365) {
            return new Intl.DateTimeFormat('en', { 
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(lastUpdated);
        }

        // Format relative time for dates between 2 days and 1 year old
        return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
            -Math.round(diffInDays),
            'day'
        );
    } catch (error) {
        console.error('[DateUtils] Error formatting date:', { date, error });
        return 'Recently';
    }
};
