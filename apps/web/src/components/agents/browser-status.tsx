import { ReactNode } from 'react';

import { Agent } from '@app-types/agent';
import { AgentState } from '@app-types/agent';

interface BrowserStatusProps {
    agent: Agent;
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

export const BrowserStatus = ({ agent, url }: BrowserStatusProps): ReactNode => {
    const message = getStatusMessage(agent.state, agent.progress);

    return (
        <div className="browser-status">
            <div className="status-message">
                {message}
                {agent.progress && agent.state === AgentState.Working && (
                    <span className="progress">({agent.progress}%)</span>
                )}
            </div>
            {url && (
                <div className="target-url" title={url}>
                    {url}
                </div>
            )}
            {agent.error && (
                <div className="error-message">
                    {agent.error}
                </div>
            )}
        </div>
    );
};
