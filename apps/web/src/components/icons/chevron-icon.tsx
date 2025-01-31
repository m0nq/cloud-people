interface ChevronIconProps {
    width?: number;
    height?: number;
    className?: string;
    strokeWidth?: number;
    color?: string;
    direction?: 'up' | 'down';
}

export const ChevronIcon = ({
    width = 14,
    height = 8,
    className,
    strokeWidth = 1.5,
    color = 'white',
    direction = 'up'
}: ChevronIconProps) => {
    const transform = direction === 'down' ? 'rotate(180)' : undefined;
    const transformOrigin = direction === 'down' ? '7px 4px' : undefined;

    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={width} 
            height={height} 
            viewBox="0 0 14 8" 
            fill="none"
            className={className}
            style={{ transform, transformOrigin }}
        >
            <path 
                d="M1 7L7 1L13 7" 
                stroke={color} 
                strokeWidth={strokeWidth} 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
        </svg>
    );
};
