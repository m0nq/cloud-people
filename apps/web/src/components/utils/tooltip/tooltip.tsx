import { ReactNode } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';

import './tooltip.styles.css';

type TooltipProps = {
    content: string;
    children: ReactNode;
    disabled?: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
};

export const Tooltip = ({
    content,
    children,
    disabled = false,
    position = 'top',
    delay = 300
}: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = () => {
        if (disabled || !content) return;

        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    if (disabled || !content) {
        return <>{children}</>;
    }

    return (
        <div className="tooltip-container" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {children}
            {isVisible && (
                <div className={`tooltip-content tooltip-${position}`}>
                    {content}
                </div>
            )}
        </div>
    );
};
