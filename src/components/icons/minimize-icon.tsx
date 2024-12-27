import { FiMinimize2 } from 'react-icons/fi';

interface MinimizeIconProps {
    width?: number;
    height?: number;
    className?: string;
    strokeWidth?: number;
    color?: string;
}

export const MinimizeIcon = ({
    width = 18,
    height = 18,
    className,
    strokeWidth = 2,
    color = '#1c64f2'
}: MinimizeIconProps) => {
    return (
        // <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 25 25" fill="none"
        //     className={className}>
        //     <g clip-path="url(#clip0_1518_16866)">
        //         <path d="M4.85913 17.9749H10.8591V23.9749"
        //             stroke={color}
        //             strokeWidth={strokeWidth}
        //             strokeLinecap="round"
        //             strokeLinejoin="round" />
        //         <path d="M20.8591 13.9749H14.8591V7.97485"
        //             stroke={color}
        //             strokeWidth={strokeWidth}
        //             strokeLinecap="round"
        //             strokeLinejoin="round" />
        //         <path d="M14.8591 13.9749L21.8591 6.97485"
        //             stroke={color}
        //             strokeWidth={strokeWidth}
        //             strokeLinecap="round"
        //             strokeLinejoin="round" />
        //         <path d="M3.85913 24.9749L10.8591 17.9749"
        //             stroke={color}
        //             strokeWidth={strokeWidth}
        //             strokeLinecap="round"
        //             strokeLinejoin="round" />
        //     </g>
        //     <defs>
        //         <clipPath id="clip0_1518_16866">
        //             <rect width="24" height="24" fill="white" transform="translate(0.859131 0.974854)" />
        //         </clipPath>
        //     </defs>
        // </svg>
        <FiMinimize2 size={height} stroke={color} strokeWidth={strokeWidth} className={className} />
    );
};
