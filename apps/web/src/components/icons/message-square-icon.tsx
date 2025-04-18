interface MessageSquareIconProps {
    width?: number;
    height?: number;
    stroke?: string;
    strokeWidth?: number;
    className?: string;
}

export const MessageSquareIcon = ({
    width = 24,
    height = 24,
    stroke = 'currentColor',
    strokeWidth = 2,
    className = ''
}: MessageSquareIconProps) => {
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
            className={`lucide lucide-message-square ${className}`}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    );
};
