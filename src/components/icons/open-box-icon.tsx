interface OpenBoxIconProps {
    width?: number;
    height?: number;
    className?: string;
}

export const OpenBoxIcon = ({ width = 116, height = 112, className }: OpenBoxIconProps) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 116 112"
            fill="none"
            className={className}>
            <g filter="url(#filter0_f_1794_837)">
                <path fill="#827EDA"
                    stroke="black"
                    d="M85.3956 70.5044C85.4131 90.9947 77.8192 77.197 61.6888 74.625C48.2608 69.9452 52.4608 86.8578 35.4047 69.6392C18.3485 52.4207 53.5166 54.3763 71.0716 36.2437C88.6266 18.1111 85.3781 50.014 85.3956 70.5044Z" />
            </g>
            <path fill="#CDDBE9"
                stroke="#2D3742"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M77.1022 69.161V55.574C77.1016 54.9783 76.9444 54.3933 76.6463 53.8776C76.3482 53.3619 75.9197 52.9336 75.4039 52.6358L63.5152 45.8423C62.9989 45.5442 62.4131 45.3872 61.8169 45.3872C61.2206 45.3872 60.6349 45.5442 60.1185 45.8423L48.2299 52.6358C47.714 52.9336 47.2855 53.3619 46.9874 53.8776C46.6893 54.3933 46.5321 54.9783 46.5315 55.574V69.161C46.5321 69.7566 46.6893 70.3417 46.9874 70.8574C47.2855 71.3731 47.714 71.8013 48.2299 72.0992L60.1185 78.8927C60.6349 79.1908 61.2206 79.3477 61.8169 79.3477C62.4131 79.3477 62.9989 79.1908 63.5152 78.8927L75.4039 72.0992C75.9197 71.8013 76.3482 71.3731 76.6463 70.8574C76.9444 70.3417 77.1016 69.7566 77.1022 69.161Z" />
            <path d="M61.8169 79.4873V62.3677" stroke="#2D3742" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" />
            <path d="M61.8169 64.1094V46.9897" stroke="#2D3742" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" />
            <path fill="#CDDBE9"
                stroke="#2D3742"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M70.5438 36.3826L63.1184 45.6835L77.5012 54.552L85.6943 44.8669L70.5438 36.3826Z" />
            <path fill="#CDDBE9"
                stroke="#2D3742"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M36.0013 54.2651L47.0012 53.552L62.0012 62.552L52.9699 65.1735L36.0013 54.2651Z" />
            <circle cx="58.5604" cy="53.7452" r="3.86383" fill="white" />
            <circle cx="73.8137" cy="52.6221" r="2.74071" fill="white" />
            <circle cx="66.3518" cy="51.5681" r="3.23265" fill="white" />
            <circle cx="51.8267" cy="50.9378" r="3.86383" fill="white" />
            <circle cx="62.7421" cy="58.892" r="2.83392" fill="white" />
            <circle cx="60.0653" cy="45.5409" r="3.05363" fill="white" />
            <circle cx="71.0734" cy="45.2111" r="2.72384" fill="white" />
            <circle cx="54.6969" cy="54.8016" r="1.93983" fill="white" />
            <circle cx="63.382" cy="49.6788" r="1.93983" fill="white" />
            <circle cx="62.3168" cy="53.745" r="1.93983" fill="white" />
            <circle cx="70.2894" cy="52.4103" r="1.93983" fill="white" />
            <circle cx="65.5765" cy="40.5475" r="1.93983" fill="white" />
            <circle cx="58.9515" cy="32.1593" r="1.93983" fill="white" />
            <circle cx="68.2914" cy="28.0275" r="1.93983" fill="white" />
            <path
                d="M60.914 61.1205L49.8884 54.425L51.4922 53.3025L74.3049 53.6633L74.7459 55.3071L64.7628 61.0805L60.914 61.1205Z"
                fill="white" />
            <path d="M47.3809 53.2649L61.7129 62.3365L76.0776 54.2544" stroke="#2D3742" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            <defs>
                <filter id="filter0_f_1794_837" x="0.858154" y="0.870117" width="114.764" height="110.683"
                    filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                    <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur_1794_837" />
                </filter>
            </defs>
        </svg>
    );
};
