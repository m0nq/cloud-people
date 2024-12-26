interface BranchesIconProps {
    width?: number;
    height?: number;
    className?: string;
    strokeWidth?: number;
    color?: string;
}

export const BranchesIcon = ({
    width = 26,
    height = 26,
    className,
    strokeWidth = 1.5,
    color = 'currentColor'
}: BranchesIconProps) => {
    return (
        <svg width={width} height={height} className={className} viewBox="4 -4 26 26"
            xmlns="http://www.w3.org/2000/svg">
            <rect x="16.8995"
                y="1"
                width="14"
                height="14"
                transform="rotate(45 16.8995 1)"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none" />
            <path d="M1 11L7 11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
                strokeLinejoin="round" />
            <path d="M22 5.65686L26.2426 1.41422" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
                strokeLinejoin="round" />
            <path d="M22 16L26.2426 20.2426" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
                strokeLinejoin="round" />
        </svg>
    );
};
