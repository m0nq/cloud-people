import { useState } from 'react';
import { useEffect } from 'react';
import { useCallback } from 'react';
import { useRef } from 'react';
import { useMemo } from 'react';
import { ReactNode } from 'react';
import { FiUsers } from 'react-icons/fi';

import { AgentState } from '@app-types/agent';
import { AgentData } from '@app-types/agent';
import { AGENT_SKILLS } from '@app-types/agent/skills';
import { AgentCard } from '@components/agents/agent-card';
import { CloseIcon } from '@components/icons/close-icon';
import { SearchIcon } from '@components/icons/search-icon';
import { LoadingSpinner } from '@components/spinners/loading-spinner';
import { fetchAgents } from '@lib/actions/agent-actions';
import { useAgentCacheStore } from '@stores/agent-cache-store';
import { useWorkflowStore } from '@stores/workflow';
import { useTrayStore } from '@stores/tray-store';

import './agent-selection-tray.styles.css';

type AgentSelectionTrayProps = {
    onClose: () => void;
    parentNodeId?: string | null;
};

export const AgentSelectionTray = ({ onClose, parentNodeId }: AgentSelectionTrayProps): ReactNode => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSkill, setSelectedSkill] = useState<string>(AGENT_SKILLS[0]);

    const { agents, lastFetchTime, setAgents } = useAgentCacheStore();
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

    // Filter agents based on search query and selected skill
    const filteredAgents = useMemo(() => {
        return agents.filter(agent => {
            const matchesSearch = searchQuery.trim() === '' ||
                agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
            // || agent.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesSkill = selectedSkill === AGENT_SKILLS[0];
            // || agent.skills?.some(skill => skill === selectedSkill);

            return matchesSearch && matchesSkill;
        });
    }, [agents, searchQuery, selectedSkill]);

    // Handle agent selection
    const handleAgentSelect = useCallback((agent: AgentData) => {
            // Close the tray first to prevent UI jank
            closeTray();

            // Let the workflow store handle the logic of creating a workflow if needed
            try {
                const workflowStore = useWorkflowStore.getState();
                workflowStore.addAgentToWorkflow({
                    ...agent,
                    parentNodeId // This might be undefined or null if no workflow exists
                });
            } catch (error) {
                console.error('Failed to add agent to workflow:', error);
                // Show error to user
                // TODO: Add proper error handling UI
            }
        },
        [closeTray, parentNodeId]
    );

    return (
        <div className="agent-tray" role="dialog" aria-labelledby="tray-title">
            <div className="agent-tray-header">
                <div className="agent-tray-title-container">
                    <FiUsers size={18} className="agent-tray-user-icon" />
                    <h2 id="tray-title" className="agent-tray-title">Agents</h2>
                </div>
                <button onClick={onClose}
                    className="agent-tray-close-button"
                    aria-label="Close agent selection tray">
                    <CloseIcon width={20} height={20} />
                </button>
            </div>

            <div className="agent-tray-body">
                {/* Search Input */}
                <div className="agent-tray-search">
                    <input type="text"
                        placeholder="Search agents..."
                        className="agent-tray-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search agents" />
                    <span className="agent-tray-search-icon">
                        <SearchIcon width={16} height={16} color="#9DA3AE" />
                    </span>
                </div>

                {/* Filter Dropdown */}
                <div className="agent-tray-filter">
                    <div className="agent-tray-filter-dropdown">
                        <select className="agent-skills-select"
                            value={selectedSkill}
                            onChange={(e) => setSelectedSkill(e.target.value)}
                            aria-label="Filter by skill">
                            {AGENT_SKILLS.map((skill) => (
                                <option key={skill} value={skill}>{skill}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Agent Content */}
                {error ? (
                    <div className="agent-tray-error">
                        Failed to load agents. Please try again or contact support if the issue persists.
                    </div>
                ) : loading ? (
                    <div className="agent-tray-loading">
                        <LoadingSpinner size={32} color="text-blue-400" />
                        <span className="agent-tray-loading-text">Loading agents...</span>
                    </div>
                ) : (
                    <>
                        {!filteredAgents.length ? (
                            <div className="agent-tray-empty">
                                No agents found matching your search criteria.
                            </div>
                        ) : (
                            <ul className="agent-tray-list">
                                {filteredAgents.map((agent: AgentData) => (
                                    <li key={agent.id}
                                        className="agent-tray-list-item"
                                        onClick={() => handleAgentSelect(agent)}>
                                        <AgentCard agentId={agent.id}
                                            agentData={agent}
                                            state={AgentState.Initial} />
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
