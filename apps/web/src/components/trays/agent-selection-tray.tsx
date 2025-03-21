import { useState } from 'react';
import { useEffect } from 'react';
import { useCallback } from 'react';
import { ReactNode } from 'react';

import './agent-selection-tray.styles.css';

// Placeholder for icons
const CloseIcon = (): ReactNode => (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd" />
    </svg>
);

const UserIcon = (): ReactNode => (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd" />
    </svg>
);

const LoadingSpinner = (): ReactNode => (
        <svg className="animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4" />
            <path className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
;

type AgentSelectionTrayProps = {
    onClose: () => void;
    parentNodeId?: string;
};

export const AgentSelectionTray = ({
    onClose,
    parentNodeId
}: AgentSelectionTrayProps): ReactNode => {
    // Placeholder for state
    const [isLoading, setIsLoading] = useState(false);
    const [agents, setAgents] = useState<any[]>([]);

    // Placeholder for agent loading logic
    useEffect(() => {
        const loadAgents = async () => {
            setIsLoading(true);
            try {
                // This will be replaced with actual API call
                setTimeout(() => {
                    setAgents([
                        {
                            id: '1',
                            name: 'Agent 1',
                            description: 'Description for Agent 1'
                        },
                        {
                            id: '2',
                            name: 'Agent 2',
                            description: 'Description for Agent 2'
                        }
                    ]);
                    setIsLoading(false);
                }, 1000);
            } catch (error) {
                console.error('Error loading agents:', error);
                setIsLoading(false);
            }
        };

        loadAgents();
    }, [parentNodeId]);

    // Placeholder for agent selection handler
    const handleAgentSelect = useCallback((agent: any) => {
            console.log('Selected agent:', agent);
            onClose();
        },
        [onClose]
    );

    return (
        <div className="agent-tray">
            <div className="agent-tray-header">
                <h2 className="agent-tray-title">Select Agent</h2>
                <button onClick={onClose} className="agent-tray-close-button">
                    <CloseIcon />
                </button>
            </div>

            <div className="agent-tray-body">
                {isLoading ? (
                    <div className="agent-tray-loading">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <ul className="agent-tray-list">
                        {agents.map((agent) => (
                            <li
                                key={agent.id}
                                className="agent-tray-list-item"
                                onClick={() => handleAgentSelect(agent)}>
                                <div className="agent-tray-agent">
                                    <div className="agent-tray-agent-icon-container">
                                        <UserIcon />
                                    </div>
                                    <div className="agent-tray-agent-details">
                                        <h3 className="agent-tray-agent-name">{agent.name}</h3>
                                        <p className="agent-tray-agent-description">
                                            {agent.description}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
