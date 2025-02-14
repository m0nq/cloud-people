import { ReactNode } from 'react';

import { Agent } from '@app-types/agent';
import { AgentState } from '@app-types/agent';

interface BrowserStatusProps {
    state: Agent;
    url?: string;
}

const getStatusMessage = (state: AgentState, progress?: number): ReactNode => {
    switch (status) {
        case AgentState.Initial:
            return 'Ready to navigate';
        case AgentState.Activating:
            return 'Launching browser...';
        case AgentState.Working:
            if (progress) {
                if (progress < 30) return 'Launching browser...';
                if (progress < 50) return 'Creating browser context...';
                if (progress < 70) return 'Opening page...';
                return 'Navigating to page...';
            }
            return 'Working...';
        case AgentState.Complete:
            return 'Navigation complete';
        case AgentState.Error:
            return 'Navigation failed';
        default:
            return 'Ready';
    }
};

export const BrowserStatus = ({ state, url }: BrowserStatusProps): ReactNode => {
    const message = getStatusMessage(state.state, state.progress);

    return (
        <div className="browser-status">
            <div className="status-message">
                {message}
                {state.progress && state.state === AgentState.Working && (
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
