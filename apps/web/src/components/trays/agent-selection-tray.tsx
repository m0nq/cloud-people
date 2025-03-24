import { useState } from 'react';
import { useEffect } from 'react';
import { useCallback } from 'react';
import { useRef } from 'react';
import { useMemo } from 'react';
import { ReactNode } from 'react';
import { FiUsers } from 'react-icons/fi';

import { AgentCard } from '@components/agents/agent-card';
import { AgentData } from '@app-types/agent';
import { DEFAULT_AGENT_STATE } from '@stores/agent-store';
import { useAgentStore } from '@stores/agent-store';
import { useTrayStore } from '@stores/tray-store';
import { useAgentCacheStore } from '@stores/agent-cache-store';
import { fetchAgents } from '@lib/actions/agent-actions';
import { CloseIcon } from '@components/icons/close-icon';
import { SearchIcon } from '@components/icons/search-icon';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSkill, setSelectedSkill] = useState('All Skills');

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

    // Filter agents based on search query and selected skill
    const filteredAgents = useMemo(() => {
        return agents.filter(agent => {
            const matchesSearch = searchQuery.trim() === '' ||
                agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
            // || agent.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesSkill = selectedSkill === 'All Skills';
            // || agent.skills?.some(skill => skill === selectedSkill);

            return matchesSearch && matchesSkill;
        });
    }, [agents, searchQuery, selectedSkill]);

    // Get unique skills from all agents
    // const availableSkills = useMemo(() => {
    //     const skillSet = new Set<string>();
    //     agents.forEach(agent => {
    //         agent.skills?.forEach(skill => skillSet.add(skill));
    //     });
    //     return ['All Skills', ...Array.from(skillSet)];
    // }, [agents]);

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
                <div className="agent-tray-search relative">
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
                        <span>{selectedSkill}</span>
                        <svg xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                        {/*<select className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"*/}
                        {/*    value={selectedSkill}*/}
                        {/*    onChange={(e) => setSelectedSkill(e.target.value)}*/}
                        {/*    aria-label="Filter by skill">*/}
                        {/*    {availableSkills.map(skill => (*/}
                        {/*        <option key={skill} value={skill}>{skill}</option>*/}
                        {/*    ))}*/}
                        {/*</select>*/}
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
                                {filteredAgents.map((agent) => (
                                    <li key={agent.id}
                                        className="agent-tray-list-item"
                                        onClick={() => handleAgentSelect(agent)}>
                                        <AgentCard agentId={agent.id}
                                            agentData={agent}
                                            state={DEFAULT_AGENT_STATE.state} />
                                        {/*{agent.accuracy && (*/}
                                        {/*    <div className="agent-tray-accuracy mt-2">*/}
                                        {/*        <svg xmlns="http://www.w3.org/2000/svg"*/}
                                        {/*            width="16"*/}
                                        {/*            height="16"*/}
                                        {/*            viewBox="0 0 24 24"*/}
                                        {/*            fill="currentColor"*/}
                                        {/*            stroke="currentColor"*/}
                                        {/*            strokeWidth="0"*/}
                                        {/*            strokeLinecap="round"*/}
                                        {/*            strokeLinejoin="round"*/}
                                        {/*            className="mr-1">*/}
                                        {/*            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>*/}
                                        {/*        </svg>*/}
                                        {/*        <span>{agent.accuracy}% accuracy</span>*/}
                                        {/*    </div>*/}
                                        {/*)}*/}
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
