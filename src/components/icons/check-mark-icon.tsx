interface CheckMarkIconProps {
    width?: number;
    height?: number;
    className?: string;
    strokeWidth?: number;
    color?: string;
}

export const CheckMarkIcon = ({
    width = 11,
    height = 11,
    className,
    strokeWidth = 1,
    color = 'currentColor'
}: CheckMarkIconProps) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 11 11" fill="none"
            className={className}>
            <path stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.73926 5.56343V5.97743C9.7387 6.94782 9.42448 7.89203 8.84345 8.66925C8.26243 9.44646 7.44573 10.015 6.51517 10.2902C5.5846 10.5653 4.59002 10.5323 3.67977 10.196C2.76951 9.8597 1.99235 9.23817 1.46419 8.42411C0.936028 7.61004 0.685164 6.64706 0.749012 5.67877C0.812861 4.71048 1.188 3.78878 1.81848 3.05111C2.44897 2.31345 3.30101 1.79935 4.24754 1.58549C5.19407 1.37164 6.18438 1.46948 7.07076 1.86443" />
            <path d="M9.73928 2.37744L5.23928 6.88194L3.88928 5.53194" stroke={color} strokeWidth={strokeWidth}
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};
