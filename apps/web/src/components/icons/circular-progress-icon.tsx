interface CircularProgressIconProps {
    width?: number;
    height?: number;
    progress?: number; // 0 to 100
    strokeColor?: string;
    progressColor?: string;
    strokeWidth?: number;
}

export const CircularProgressIcon = ({
    width = 14,
    height = 15,
    progress = 0,
    strokeColor = '#ffffff',
    progressColor = '#56e8cd',
    strokeWidth = 1
}: CircularProgressIconProps) => {
    // Ensure progress is between 0 and 100
    const normalizedProgress = Math.min(100, Math.max(0, progress));

    // Calculate the circle's properties
    const radius = 6;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (normalizedProgress / 100) * circumference;

    return (
        <svg width={width} height={height} viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Base circle */}
            <rect x="0.5" y="1.5" width="12" height="12" rx="6" stroke={strokeColor} strokeWidth={strokeWidth} />

            {/* Progress circle */}
            <circle
                cx="6.5"
                cy="7.5"
                r={radius}
                fill="none"
                stroke={progressColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 6.5 7.5)"
                style={{
                    transition: 'stroke-dashoffset 0.3s ease'
                }}
            />
        </svg>
    );
};
