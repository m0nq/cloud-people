import { useState } from 'react';
import { useEffect } from 'react';
import { useCallback } from 'react';
import { useRef } from 'react';
import { useMemo } from 'react';
import { ReactNode } from 'react';

import { AgentCard } from '@components/agents/agent-card';
import { AgentData } from '@app-types/agent';
import { DEFAULT_AGENT_STATE } from '@stores/agent-store';
import { useAgentStore } from '@stores/agent-store';
import { useTrayStore } from '@stores/tray-store';
import { useAgentCacheStore } from '@stores/agent-cache-store';
import { fetchAgents } from '@lib/actions/agent-actions';
import { CloseIcon } from '@components/icons';
import { LoadingSpinner } from '@components/spinners/loading-spinner';

import './agent-selection-tray.styles.css';

type AgentSelectionTrayProps = {
    onClose: () => void;
    parentNodeId?: string;
};

export const AgentSelectionTray = ({ onClose, parentNodeId }: AgentSelectionTrayProps): ReactNode => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('agents');

    const { agents, lastFetchTime, setAgents } = useAgentCacheStore();
    const { setAgentData } = useAgentStore();
    const { closeTray } = useTrayStore();
    const isInitialMount = useRef(true);

    // Load agents from cache or fetch new ones
    useEffect(() => {
        let isMounted = true;

        (async () => {
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
        })();

        return () => {
            isMounted = false;
        };
    }, [lastFetchTime, setAgents]);

    const initialAgentState = useMemo(() => ({
        ...DEFAULT_AGENT_STATE
    }), []);

    // Handle agent selection
    const handleAgentSelect = useCallback((agent: AgentData) => {
        // Create a unique ID for this instance of the agent
        const uniqueAgentId = `${agent.id}-${Date.now()}`;

        // Create a new agent instance with the unique ID
        const newAgent = {
            ...agent,
            id: uniqueAgentId,
            parentNodeId
        };

        // Synchronize with AgentStore before proceeding
        setAgentData(uniqueAgentId, newAgent);

        // Close the tray first to prevent UI jank
        closeTray();

        // Then select the agent (which will trigger addNode)
        setTimeout(() => {
            // Here we would trigger the same action as in the modal
            // For now, just log the selection
            console.log('Selected agent:', newAgent);
        }, 0);
    }, [closeTray, parentNodeId, setAgentData]);

    return (
        <div className="agent-tray" role="dialog" aria-labelledby="tray-title">
            <div className="agent-tray-header">
                <h2 id="tray-title" className="agent-tray-title">Select Agent</h2>
                <button onClick={onClose}
                    className="agent-tray-close-button"
                    aria-label="Close agent selection tray">
                    <CloseIcon width={20} height={20} />
                </button>
            </div>

            <div className="agent-tray-body">
                {/* Tabs */}
                <div className="agent-tray-tabs">
                    <button className={`agent-tray-tab ${activeTab === 'agents' ? 'agent-tray-tab-active' : ''}`}
                        onClick={() => setActiveTab('agents')}>
                        My Agents
                    </button>
                    <button className={`agent-tray-tab ${activeTab === 'store' ? 'agent-tray-tab-active' : ''}`}
                        onClick={() => setActiveTab('store')}>
                        Agent Store
                    </button>
                </div>

                {/* Agent Content */}
                {error ? (
                    <div className="agent-tray-error">
                        Failed to load agents. Please try again or contact support if the issue persists.
                    </div>
                ) : loading ? (
                    <div className="agent-tray-loading">
                        <LoadingSpinner size={32} color="text-blue-500" />
                        <span className="agent-tray-loading-text">Loading agents...</span>
                    </div>
                ) : (
                    <>
                        {!agents.length ? (
                            <div className="agent-tray-empty">
                                You currently have no agents. Build some in the Agent Builder or buy one in our Store.
                            </div>
                        ) : (
                            <ul className="agent-tray-list">
                                {agents.map((agent) => (
                                    <li key={agent.id}
                                        className="agent-tray-list-item"
                                        onClick={() => handleAgentSelect(agent)}>
                                        <AgentCard agentId={agent.id}
                                            agentData={agent}
                                            state={DEFAULT_AGENT_STATE.state} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
