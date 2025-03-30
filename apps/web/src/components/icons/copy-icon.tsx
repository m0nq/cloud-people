interface CopyIconProps {
    width?: number;
    height?: number;
    stroke?: string;
    strokeWidth?: number;
    className?: string;
}

export const CopyIcon = ({
    width = 24,
    height = 24,
    stroke = 'currentColor',
    strokeWidth = 2,
    className = ''
}: CopyIconProps) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`lucide lucide-copy ${className}`}>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
        </svg>
    );
};
