import React from 'react';

interface DocumentIconProps {
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
}

export const DocumentIcon = ({ width = 24, height = 24, color = '#BEC1CF', strokeWidth = 1.5 }: DocumentIconProps) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 20 21" fill="none">
            <path
                d="M11.5675 2.2207H5.23421C4.81429 2.2207 4.41156 2.3963 4.11463 2.70886C3.81769 3.02142 3.65088 3.44534 3.65088 3.88737V17.2207C3.65088 17.6627 3.81769 18.0867 4.11463 18.3992C4.41156 18.7118 4.81429 18.8874 5.23421 18.8874H14.7342C15.1541 18.8874 15.5569 18.7118 15.8538 18.3992C16.1507 18.0867 16.3175 17.6627 16.3175 17.2207V7.2207L11.5675 2.2207Z"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M11.5679 2.2207V7.2207H16.3179"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M13.1512 11.3867H6.81787"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M13.1512 14.7207H6.81787"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8.4012 8.05371H7.60954H6.81787"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
