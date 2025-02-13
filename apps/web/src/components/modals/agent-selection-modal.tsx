import { useState } from 'react';
import { useCallback } from 'react';
import { useMemo } from 'react';
import { ReactNode } from 'react';

import './agent-selection-modal.styles.css';
import { AgentCard } from '@components/agents/agent-card';
import { AgentData } from '@app-types/agent';
import { AgentStatus } from '@app-types/agent';
import { useModalStore } from '@stores/modal-store';
import { createAgent } from '@lib/actions/agent-actions';

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
                    command: 'navigate'
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
                    command: 'navigate'
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    const handleAgentSelect = useCallback(async (agentData: AgentData) => {
            try {
                setLoading(true);
                setError(null);

                // Create the agent in the database with all necessary data
                const dbAgent = await createAgent({
                    data: {
                        config: {
                            name: agentData.name,
                            description: agentData.role,
                            workflowId: parentNodeId,
                            ...agentData.config
                        },
                        tools: agentData.tools || []
                    }
                });

                // Update the agent data with the database ID and parent node ID
                const updatedAgentData = {
                    ...agentData,
                    id: dbAgent.id,
                    parentNodeId
                };

                onSelect(updatedAgentData);
                onClose();
            } catch (err) {
                console.error('Failed to create agent:', err);
                setError('Failed to create agent. Please try again.');
            } finally {
                setLoading(false);
            }
        },
        [onClose, onSelect, parentNodeId]
    );

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
                    {/* {loading ? (
                     <div>Creating agent...</div>
                     ) : ( */}
                    {AVAILABLE_AGENTS.map(agent => (
                        <div key={agent.name} className="agent-card-container" onClick={() => handleAgentSelect(agent)}>
                            <AgentCard data={agent} state={initialAgentState} />
                        </div>
                    ))}
                    {/* } */}
                    {error && <div className="error-message">{error}</div>}
                </div>
            </div>
        </div>
    );
};
