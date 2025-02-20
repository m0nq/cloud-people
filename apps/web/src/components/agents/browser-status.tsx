import { ReactNode } from 'react';

import { AgentState } from '@app-types/agent';

interface BrowserStatusProps {
    agentState: AgentState;
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

export const BrowserStatus = ({ agentState, url }: BrowserStatusProps): ReactNode => {
    // const message = getStatusMessage(agentState.state, agentState.progress);
    //
    // return (
    //     <div className="browser-status">
    //         <div className="status-message">
    //             {message}
    //             {agentState.progress && agentState.state === AgentState.Working && (
    //                 <span className="progress">({agentState.progress}%)</span>
    //             )}
    //         </div>
    //         {url && (
    //             <div className="target-url" title={url}>
    //                 {url}
    //             </div>
    //         )}
    //         {agentState.error && (
    //             <div className="error-message">
    //                 {agentState.error}
    //             </div>
    //         )}
    //     </div>
    // );
    return <></>;
};
