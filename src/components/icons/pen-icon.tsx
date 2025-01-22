import React from 'react';

interface PenIconProps {
    fillColor?: string;
    strokeColor?: string;
    width?: number;
    height?: number;
}

export const PenIcon = ({ strokeColor = '#7d829a', width = 12, height = 13 }: PenIconProps) => {
    return (
        <svg width={width} height={height} viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path stroke={strokeColor}
                strokeWidth="1.39326"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.60687 1.75434C8.74006 1.62115 8.89818 1.5155 9.07221 1.44341C9.24623 1.37133 9.43275 1.33423 9.62112 1.33423C9.80948 1.33423 9.996 1.37133 10.17 1.44341C10.344 1.5155 10.5022 1.62115 10.6354 1.75434C10.7686 1.88754 10.8742 2.04566 10.9463 2.21969C11.0184 2.39371 11.0555 2.58023 11.0555 2.76859C11.0555 2.95696 11.0184 3.14348 10.9463 3.3175C10.8742 3.49153 10.7686 3.64965 10.6354 3.78284L3.78918 10.629L1 11.3897L1.76069 8.60052L8.60687 1.75434Z" />
        </svg>
    );
};
