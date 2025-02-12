import { ReactNode } from 'react';

import { AgentState } from '@lib/definitions';
import { AgentStatus } from '@lib/definitions';

interface BrowserStatusProps {
    state: AgentState;
    url?: string;
}

const getStatusMessage = (status: AgentStatus, progress?: number): ReactNode => {
    switch (status) {
        case AgentStatus.Initial:
            return 'Ready to navigate';
        case AgentStatus.Activating:
            return 'Launching browser...';
        case AgentStatus.Working:
            if (progress) {
                if (progress < 30) return 'Launching browser...';
                if (progress < 50) return 'Creating browser context...';
                if (progress < 70) return 'Opening page...';
                return 'Navigating to page...';
            }
            return 'Working...';
        case AgentStatus.Complete:
            return 'Navigation complete';
        case AgentStatus.Error:
            return 'Navigation failed';
        default:
            return 'Ready';
    }
};

export const BrowserStatus = ({ state, url }: BrowserStatusProps): ReactNode => {
    const message = getStatusMessage(state.status, state.progress);
    
    return (
        <div className="browser-status">
            <div className="status-message">
                {message}
                {state.progress && state.status === AgentStatus.Working && (
                    <span className="progress">({state.progress}%)</span>
                )}
            </div>
            {url && (
                <div className="target-url" title={url}>
                    {url}
                </div>
            )}
            {state.error && (
                <div className="error-message">
                    {state.error}
                </div>
            )}
        </div>
    );
};
