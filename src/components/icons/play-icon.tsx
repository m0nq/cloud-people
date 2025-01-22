import { SVGProps } from 'react';

interface PlayIconProps {
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
    className?: string;
}

export const PlayIcon = ({
    width = 31,
    height = 31,
    color = 'white',
    strokeWidth = 2,
    className,
    ...props
}: PlayIconProps & Omit<SVGProps<SVGSVGElement>, keyof PlayIconProps>) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 31 31" fill="none" className={className} {...props}>
            <path
                d="M15.49 29.6206C23.2516 29.6206 29.5437 23.3285 29.5437 15.5669C29.5437 7.80524 23.2516 1.51318 15.49 1.51318C7.72834 1.51318 1.43628 7.80524 1.43628 15.5669C1.43628 23.3285 7.72834 29.6206 15.49 29.6206Z"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M12.6793 9.94531L21.1115 15.5668L12.6793 21.1883V9.94531Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};
