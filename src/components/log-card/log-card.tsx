import { ReactNode } from 'react';

import './log-card.styles.css';
import { GridIcon } from '@components/icons/grid-icon';
import { CircularProgressIcon } from '@components/icons/circular-progress-icon';

interface LogCardProps {
    // We'll add proper props later when we have the data structure
    color?: string;
    children?: ReactNode;
    progress?: number;
}

export const LogCard = ({ children, color = '#9CA3AF', progress = 0 }: LogCardProps) => {
    return (
        <div className="log-card">
            <div className="flex items-center gap-2">
                <GridIcon />
                <div className="flex-1" style={{ color }}>
                    {children}
                </div>
            </div>
            <CircularProgressIcon progress={progress} />
        </div>
    );
};
