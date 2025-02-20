import { useState } from 'react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useMemo } from 'react';
import { ReactNode } from 'react';

import './agent-selection-modal.styles.css';
import { AgentCard } from '@components/agents/agent-card';
import { AgentData } from '@app-types/agent';
import { DEFAULT_AGENT_STATE } from '@stores/agent-store';
import { useModalStore } from '@stores/modal-store';
import { useAgentCacheStore } from '@stores/agent-cache-store';
import { fetchAgents } from '@lib/actions/agent-actions';

export interface AgentSelectionModalProps {
    parentNodeId: string;
    onClose: () => void;
    onSelect: (agentData: AgentData) => void;
    children?: ReactNode;
}

export const AgentSelectionModal = ({ onClose, onSelect, parentNodeId, children }: AgentSelectionModalProps) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('agents');
    const { agents, lastFetchTime, setAgents } = useAgentCacheStore();
    const { openModal } = useModalStore();
    const isInitialMount = useRef(true);

    useEffect(() => {
        let isMounted = true;

        const loadAgents = async () => {
            try {
                // Only check cache on initial mount or when lastFetchTime is 0 (cache invalidated)
                if (!isInitialMount.current && lastFetchTime !== 0) {
                    setLoading(false);
                    return;
                }

                // Cache is invalid or it's initial mount, fetch new data
                const newAgents = await fetchAgents();
                if (isMounted) {
                    setAgents(newAgents);
                }
            } catch (err) {
                if (isMounted) {
                    setError('Failed to load agents');
                    console.error('Error loading agents:', err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                    isInitialMount.current = false;
                }
            }
        };

        loadAgents();

        return () => {
            isMounted = false;
        };
    }, [lastFetchTime, setAgents]);

    const handleBuildAgentClick = useCallback(() => {
        openModal({
            type: 'agent-config',
            parentNodeId,
            isFromModal: true
        });
    }, [parentNodeId, openModal]);

    const initialAgentState = useMemo(
        () => ({
            ...DEFAULT_AGENT_STATE
        }),
        []
    );

    const handleAgentSelect = useCallback(
        (agent: AgentData) => {
            onSelect({ ...agent, parentNodeId });
            onClose();
        },
        [onSelect, onClose, parentNodeId]
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
                    <button className={`tab ${activeTab === 'agents' ? 'active-state' : ''}`} onClick={() => setActiveTab('agents')}>
                        My Agents
                    </button>
                    <button className={`tab ${activeTab === 'store' ? 'active-state' : ''}`} onClick={() => setActiveTab('store')}>
                        Agent Store
                    </button>
                </div>

                {/* Agent Cards Grid */}
                {error ? (
                    <div className="w-full h-fit text-white">Failed to load agents. Please try again or contact support if the issue persists.</div>
                ) : loading ? (
                    <div className="loading">Loading agents...</div>
                ) : (
                    <>
                        {!agents.length ? (
                            <div className="no-agents-message">You currently have no agents. Build some in the Agent Builder or buy one in our Store.</div>
                        ) : (
                            <div className="agents-grid">
                                {agents.map(agent => (
                                    <div key={agent.id} className="agent-card-container" onClick={() => handleAgentSelect(agent)}>
                                        <AgentCard data={agent} agent={initialAgentState} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
