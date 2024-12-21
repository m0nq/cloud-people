interface SaveDocumentIconProps {
    width?: number;
    height?: number;
    className?: string;
    strokeWidth?: number;
    color?: string;
}

export const SaveDocumentIcon = ({
    width = 11,
    height = 11,
    className,
    strokeWidth = 1,
    color = '#2f3338'
}: SaveDocumentIconProps) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 11 11" fill="none"
            className={className}>
            <path stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.88159 10.4749H1.88159C1.61638 10.4749 1.36202 10.3695 1.17448 10.182C0.986949 9.99442 0.881592 9.74007 0.881592 9.47485V2.47485C0.881592 2.20964 0.986949 1.95528 1.17448 1.76775C1.36202 1.58021 1.61638 1.47485 1.88159 1.47485H7.38159L9.88159 3.97485V9.47485C9.88159 9.74007 9.77623 9.99442 9.5887 10.182C9.40116 10.3695 9.14681 10.4749 8.88159 10.4749Z" />
            <path d="M7.88159 10.4749V6.47485H2.88159V10.4749" stroke={color} strokeWidth={strokeWidth}
                strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.88159 1.47485V3.97485H6.88159" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
                strokeLinejoin="round" />
        </svg>
    );
};
