import React from 'react';

interface InfoIconProps {
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
}

export const InfoIcon = ({ width = 24, height = 24, color = '#45505a', strokeWidth = 1 }: InfoIconProps) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 25 25" fill="none">
            <path
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12.626 22.9072C18.1488 22.9072 22.626 18.4301 22.626 12.9072C22.626 7.38438 18.1488 2.90723 12.626 2.90723C7.10313 2.90723 2.62598 7.38438 2.62598 12.9072C2.62598 18.4301 7.10313 22.9072 12.626 22.9072Z"
            />
            <path
                d="M12.626 16.9072V12.9072"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.626 8.90723H12.636"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
