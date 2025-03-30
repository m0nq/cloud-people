interface FileCodeIconProps {
    width?: number;
    height?: number;
    stroke?: string;
    strokeWidth?: number;
    className?: string;
}

export const FileCodeIcon = ({
    width = 24,
    height = 24,
    stroke = 'currentColor',
    strokeWidth = 2,
    className = ''
}: FileCodeIconProps) => {
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
            className={`lucide lucide-file-code ${className}`}>
            <path d="M10 12.5 8 15l2 2.5"></path>
            <path d="m14 12.5 2 2.5-2 2.5"></path>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"></path>
        </svg>
    );
};
