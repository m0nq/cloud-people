interface ClosedBoxIconProps {
    width?: number;
    height?: number;
    className?: string;
    strokeColor?: string;
}

export const ClosedBoxIcon = ({
    width = 64,
    height = 64,
    className,
    strokeColor = '#bac5d1'
}: ClosedBoxIconProps) => {
    return (
        <svg width={width} height={height} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
            className={className}>
            <path
                d="M47.4248 38.6603V25.1381C47.4242 24.5453 47.2677 23.9631 46.971 23.4498C46.6744 22.9366 46.2479 22.5104 45.7345 22.214L33.9027 15.4529C33.3888 15.1562 32.8058 15 32.2124 15C31.619 15 31.036 15.1562 30.5221 15.4529L18.6903 22.214C18.1769 22.5104 17.7504 22.9366 17.4538 23.4498C17.1571 23.9631 17.0006 24.5453 17 25.1381V38.6603C17.0006 39.2531 17.1571 39.8353 17.4538 40.3486C17.7504 40.8618 18.1769 41.288 18.6903 41.5844L30.5221 48.3455C31.036 48.6422 31.619 48.7984 32.2124 48.7984C32.8058 48.7984 33.3888 48.6422 33.9027 48.3455L45.7345 41.5844C46.2479 41.288 46.6744 40.8618 46.971 40.3486C47.2677 39.8353 47.4242 39.2531 47.4248 38.6603Z"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round" />
            <path d="M17.4551 23.3801L32.2111 31.916L46.9671 23.3801" stroke={strokeColor} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            <path d="M32.2117 48.9371V31.8992" stroke={strokeColor} strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" />
        </svg>
    );
};
