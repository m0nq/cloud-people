interface OpenBoxIconProps {
    width?: number;
    height?: number;
    className?: string;
    primaryColor?: string;
    secondaryColor?: string;
    strokeColor?: string;
}

export const OpenBoxIcon = ({
    width = 107,
    height = 94,
    className,
    primaryColor = '#bac5d1',
    secondaryColor = '#bac5d1',
    strokeColor = '#bac5d1'
}: OpenBoxIconProps) => {
    return (
        <svg width={width} height={height} viewBox="0 0 107 94" fill="none" xmlns="http://www.w3.org/2000/svg"
            className={className}>
            <g filter="url(#filter0_f_1528_3066)">
                <path fill={secondaryColor}
                    d="M84.8946 70.4167C84.9121 90.9071 77.3182 77.1093 61.1878 74.5374C47.7598 69.8576 51.9599 86.7701 34.9037 69.5516C17.8476 52.333 53.0156 54.2887 70.5706 36.1561C88.1257 18.0235 84.8771 49.9264 84.8946 70.4167Z" />
                <path stroke={strokeColor}
                    d="M84.8946 70.4167C84.9121 90.9071 77.3182 77.1093 61.1878 74.5374C47.7598 69.8576 51.9599 86.7701 34.9037 69.5516C17.8476 52.333 53.0156 54.2887 70.5706 36.1561C88.1257 18.0235 84.8771 49.9264 84.8946 70.4167Z" />
            </g>
            <path
                d="M76.6013 69.0733V55.4863C76.6006 54.8907 76.4434 54.3056 76.1453 53.7899C75.8472 53.2742 75.4187 52.846 74.9029 52.5481L63.0143 45.7546C62.4979 45.4565 61.9121 45.2996 61.3159 45.2996C60.7196 45.2996 60.1339 45.4565 59.6175 45.7546L47.7289 52.5481C47.213 52.846 46.7846 53.2742 46.4865 53.7899C46.1884 54.3056 46.0311 54.8907 46.0305 55.4863V69.0733C46.0311 69.669 46.1884 70.254 46.4865 70.7697C46.7846 71.2854 47.213 71.7137 47.7289 72.0115L59.6175 78.805C60.1339 79.1031 60.7196 79.2601 61.3159 79.2601C61.9121 79.2601 62.4979 79.1031 63.0143 78.805L74.9029 72.0115C75.4187 71.7137 75.8472 71.2854 76.1453 70.7697C76.4434 70.254 76.6006 69.669 76.6013 69.0733Z"
                fill={primaryColor}
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round" />
            <path d="M61.3159 79.3996V62.28" stroke={strokeColor} strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" />
            <path d="M61.3159 64.0217V46.9021" stroke={strokeColor} strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" />
            <path
                d="M70.0429 36.2949L62.6174 45.5959L77.0002 54.4644L85.1933 44.7792L70.0429 36.2949Z"
                fill={primaryColor}
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round" />
            <path
                d="M35.5004 54.1774L46.5002 53.4644L61.5002 62.4644L52.4689 65.0858L35.5004 54.1774Z"
                fill={primaryColor}
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round" />
            <circle cx="58.0594" cy="53.6575" r="3.86383" fill={primaryColor} />
            <circle cx="73.3127" cy="52.5344" r="2.74071" fill={primaryColor} />
            <circle cx="65.8508" cy="51.4805" r="3.23265" fill={primaryColor} />
            <circle cx="51.3257" cy="50.8502" r="3.86383" fill={primaryColor} />
            <circle cx="62.2411" cy="58.8044" r="2.83392" fill={primaryColor} />
            <circle cx="59.5644" cy="45.4533" r="3.05363" fill={primaryColor} />
            <circle cx="70.5725" cy="45.1235" r="2.72384" fill={primaryColor} />
            <circle cx="54.1959" cy="54.714" r="1.93983" fill={primaryColor} />
            <circle cx="62.881" cy="49.5912" r="1.93983" fill={primaryColor} />
            <circle cx="61.8158" cy="53.6574" r="1.93983" fill={primaryColor} />
            <circle cx="69.7885" cy="52.3226" r="1.93983" fill={primaryColor} />
            <circle cx="65.0756" cy="40.4599" r="1.93983" fill={primaryColor} />
            <circle cx="58.4506" cy="32.0717" r="1.93983" fill={primaryColor} />
            <circle cx="67.7904" cy="27.9398" r="1.93983" fill={primaryColor} />
            <path
                d="M60.413 61.0329L49.3875 54.3374L50.9912 53.2148L73.8039 53.5757L74.2449 55.2195L64.2619 60.9928L60.413 61.0329Z"
                fill={primaryColor} />
            <path d="M46.8799 53.1772L61.2119 62.2488L75.5766 54.1668" stroke={strokeColor} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            <defs>
                <filter id="filter0_f_1528_3066" x="0.357178" y="0.782471" width="114.764" height="110.683"
                    filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                    <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur_1528_3066" />
                </filter>
            </defs>
        </svg>
    );
};
