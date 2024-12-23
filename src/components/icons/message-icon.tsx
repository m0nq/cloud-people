import React from 'react';

interface MessageIconProps {
    fillColor?: string;
}

export const MessageIcon = ({ fillColor = 'currentColor' }: MessageIconProps) => {
    return (
        <svg width="25" height="25" viewBox="0 0 30 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                stroke={fillColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.1293 13.6802C19.1293 14.2106 18.9186 14.7193 18.5435 15.0944C18.1685 15.4695 17.6598 15.6802 17.1293 15.6802H5.12933L1.12933 19.6802V3.68018C1.12933 3.14974 1.34005 2.64103 1.71512 2.26596C2.09019 1.89089 2.5989 1.68018 3.12933 1.68018H17.1293C17.6598 1.68018 18.1685 1.89089 18.5435 2.26596C18.9186 2.64103 19.1293 3.14974 19.1293 3.68018V13.6802Z"
            />
            <path
                stroke={fillColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.1293 19.0044C10.1293 19.5348 10.34 20.0435 10.7151 20.4186C11.0902 20.7937 11.5989 21.0044 12.1293 21.0044H24.1293L28.1293 25.0044V9.00439C28.1293 8.47396 27.9186 7.96525 27.5435 7.59018C27.1685 7.21511 26.6598 7.00439 26.1293 7.00439H12.1293C11.5989 7.00439 11.0902 7.21511 10.7151 7.59018C10.34 7.96525 10.1293 8.47396 10.1293 9.00439V19.0044Z"
            />
        </svg>
    );
};
