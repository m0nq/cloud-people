interface LoadingSpinnerProps {
    size?: number;
    color?: string;
    className?: string;
}

/**
 * A reusable loading spinner component that can be customized with size and color.
 * Uses Tailwind's animate-spin utility for smooth animation.
 */
export const LoadingSpinner = ({
    size = 32, // Default size of 32px (h-8 w-8)
    color = 'text-blue-600',
    className = ''
}: LoadingSpinnerProps) => (
    <svg className={`animate-spin ${color} ${className}`}
        style={{ width: size, height: size }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Loading"
        role="status">
        <circle className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4" />
        <path className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);
