import React from 'react';

interface WatchIconProps {
    strokeColor?: string;
    width?: number;
    height?: number;
}

export const WatchIcon = ({ strokeColor = '#7D829A', width = 17, height = 13 }: WatchIconProps) => {
    return (
        <svg width={width} height={height} viewBox="0 0 17 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M1.27771 6.34017C1.27771 6.34017 3.91288 1.06982 8.52443 1.06982C13.136 1.06982 15.7712 6.34017 15.7712 6.34017C15.7712 6.34017 13.136 11.6105 8.52443 11.6105C3.91288 11.6105 1.27771 6.34017 1.27771 6.34017Z"
                stroke={strokeColor} strokeWidth="1.31759" strokeLinecap="round" strokeLinejoin="round" />
            <path
                d="M8.52441 8.31653C9.61594 8.31653 10.5008 7.43167 10.5008 6.34015C10.5008 5.24862 9.61594 4.36377 8.52441 4.36377C7.43289 4.36377 6.54803 5.24862 6.54803 6.34015C6.54803 7.43167 7.43289 8.31653 8.52441 8.31653Z"
                stroke={strokeColor} strokeWidth="1.31759" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};
