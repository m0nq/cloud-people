interface GridIconProps {
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
}

export const GridIcon = ({ width = 14, height = 15, color = '#9ca3af', strokeWidth = 1 }: GridIconProps) => {
    return (
        <svg width={width} height={height} viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill={color}
                stroke={color}
                strokeWidth={strokeWidth}
                d="M5.53637 11.6365L5.86273 11.9628L5.53637 11.6365C5.36759 11.8053 5.13867 11.9001 4.89998 11.9001H3.49998C3.26128 11.9001 3.03236 11.8053 2.86358 11.6365L2.51505 11.985L2.86358 11.6365C2.6948 11.4677 2.59998 11.2388 2.59998 11.0001V9.6001C2.59998 9.3614 2.6948 9.13248 2.86358 8.9637C3.03236 8.79492 3.26128 8.7001 3.49998 8.7001H4.89998C5.13867 8.7001 5.36759 8.79492 5.53637 8.9637C5.70515 9.13248 5.79998 9.3614 5.79998 9.6001V11.0001C5.79998 11.2388 5.70515 11.4677 5.53637 11.6365ZM11.1364 3.3637L11.4849 3.01517L11.1364 3.3637C11.3052 3.53248 11.4 3.7614 11.4 4.0001V5.4001C11.4 5.63879 11.3052 5.86771 11.1364 6.03649L11.4899 6.39005L11.1364 6.03649C10.9676 6.20528 10.7387 6.3001 10.5 6.3001H9.09997C8.86128 6.3001 8.63236 6.20528 8.46358 6.03649C8.2948 5.86771 8.19998 5.63879 8.19998 5.4001V4.0001C8.19998 3.7614 8.2948 3.53248 8.46358 3.3637C8.63236 3.19492 8.86128 3.1001 9.09997 3.1001H10.5C10.7387 3.1001 10.9676 3.19492 11.1364 3.3637ZM2.86358 3.3637C3.03236 3.19492 3.26128 3.1001 3.49998 3.1001H4.89998C5.13867 3.1001 5.36759 3.19492 5.53637 3.3637C5.70515 3.53248 5.79998 3.7614 5.79998 4.0001V5.4001C5.79998 5.63879 5.70515 5.86771 5.53637 6.03649C5.36759 6.20528 5.13867 6.3001 4.89998 6.3001H3.49998C3.26128 6.3001 3.03236 6.20528 2.86358 6.03649C2.6948 5.86771 2.59998 5.63879 2.59998 5.4001V4.0001C2.59998 3.7614 2.6948 3.53248 2.86358 3.3637ZM8.19998 9.6001C8.19998 9.3614 8.2948 9.13248 8.46358 8.9637C8.63236 8.79492 8.86128 8.7001 9.09997 8.7001H10.5C10.7387 8.7001 10.9676 8.79492 11.1364 8.9637C11.3052 9.13248 11.4 9.3614 11.4 9.6001V11.0001C11.4 11.2388 11.3052 11.4677 11.1364 11.6365C10.9676 11.8053 10.7387 11.9001 10.5 11.9001H9.09997C8.86128 11.9001 8.63236 11.8053 8.46358 11.6365C8.2948 11.4677 8.19998 11.2388 8.19998 11.0001V9.6001Z" />
        </svg>
    );
};
