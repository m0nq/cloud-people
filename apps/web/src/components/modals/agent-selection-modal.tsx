import { useState } from 'react';
import { useCallback } from 'react';
import { useMemo } from 'react';
import { ReactNode } from 'react';

import './agent-selection-modal.styles.css';
import { AgentCard } from '@components/agents/agent-card';
import { AgentData } from '@lib/definitions';
import { AgentStatus } from '@lib/definitions';
import { useModalStore } from '@stores/modal-store';

// Define available agent capabilities
const AGENT_CAPABILITIES = {
    BROWSER_NAVIGATION: {
        id: 'browser_navigation',
        name: 'Browser Navigation',
        description: 'Navigate to specified websites',
        action: 'navigate_to_google'
    }
    // Add more capabilities as needed
} as const;

// Define available agents with their capabilities
const AVAILABLE_AGENTS: AgentData[] = [
    {
        id: 'rico-browser-agent',
        name: 'Rico',
        role: 'Browser Navigator',
        capability: AGENT_CAPABILITIES.BROWSER_NAVIGATION,
        config: {
            actions: [
                {
                    type: 'browser',
                    action: 'navigate_to_google'
                }
            ],
            aiEnabled: true
        }
    },
    {
        id: 'becca-browser-agent',
        name: 'Becca',
        role: 'Browser Navigator',
        capability: AGENT_CAPABILITIES.BROWSER_NAVIGATION,
        config: {
            actions: [
                {
                    type: 'browser',
                    action: 'navigate_to_google'
                }
            ],
            aiEnabled: true
        }
    }
    // Add more agents as needed
];

interface AgentSelectionModalProps {
    parentNodeId: string;
    onClose: () => void;
    onSelect: (agentData: AgentData) => void;
    children?: ReactNode;
}

export const AgentSelectionModal = ({
    onClose,
    onSelect,
    parentNodeId,
    children
}: AgentSelectionModalProps) => {
    const [activeTab, setActiveTab] = useState('agents');
    const { openModal } = useModalStore();

    /* TODO: fetch agents from db to collect and display them. */

    const handleBuildAgentClick = useCallback(() => {
        openModal({
            type: 'agent-config',
            parentNodeId,
            isFromModal: true
        });
    }, [parentNodeId, openModal]);

    const initialAgentState = useMemo(() => ({
        status: AgentStatus.Initial,
        isEditable: true,
        progress: 0
    }), []);

    return (
        <div className="agent-selector-container">
            <div className="agent-selector-header">
                <h2 className="text-xl font-semibold text-color-light">Add Agent</h2>
                <div className="selector-actions">
                    <button className="agent-builder-button" onClick={handleBuildAgentClick}>
                        Agent Builder
                    </button>
                    {children}
                </div>
            </div>
            <div className="agent-selector">
                {/* Search and Actions */}

                {/* Tabs */}
                <div className="modal-tabs">
                    <button className={`tab ${activeTab === 'agents' ? 'active-state' : ''}`}
                        onClick={() => setActiveTab('agents')}>
                        My Agents
                    </button>
                    <button className={`tab ${activeTab === 'store' ? 'active-state' : ''}`}
                        onClick={() => setActiveTab('store')}>
                        Agent Store
                    </button>
                </div>

                {/* Agent Cards Grid */}
                <div className="agents-grid">
                    {AVAILABLE_AGENTS.map(agent => (
                        <div key={agent.name}
                            className="agent-card-container"
                            onClick={() => {
                                onSelect({ ...agent, parentNodeId });
                                onClose();
                            }}>
                            <AgentCard data={agent} state={initialAgentState} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
