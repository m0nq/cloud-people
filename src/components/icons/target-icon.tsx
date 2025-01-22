import React from 'react';

interface TargetIconProps {
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
}

export const TargetIcon = ({ width = 24, height = 24, color = '#BEC1CF', strokeWidth = 1.5 }: TargetIconProps) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 19 19" fill="none">
            <g clipPath="url(#clip0_1422_11902)">
                <path
                    d="M9.15137 17.0537C13.2935 17.0537 16.6514 13.6958 16.6514 9.55371C16.6514 5.41158 13.2935 2.05371 9.15137 2.05371C5.00923 2.05371 1.65137 5.41158 1.65137 9.55371C1.65137 13.6958 5.00923 17.0537 9.15137 17.0537Z"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M16.6514 9.55371H13.6514"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M4.65137 9.55371H1.65137"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M9.15137 5.05371V2.05371"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M9.15137 17.0537V14.0537"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
            <defs>
                <clipPath id="clip0_1422_11902">
                    <rect width="18" height="18" fill="white" transform="translate(0.151367 0.553711)" />
                </clipPath>
            </defs>
        </svg>
    );
};
