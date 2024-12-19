import { CiSearch } from 'react-icons/ci';
import { useState } from 'react';
import { ReactNode } from 'react';

import './agent-selection-modal.styles.css';
import { AgentCard } from '@components/agents/agent-card';
import { AgentData } from '@lib/definitions';

interface AgentSelectionModalProps {
    parentNodeId: string;
    onClose: () => void;
    onSelect: (agentData: AgentData) => void;
    children: ReactNode;
}

export const AgentSelectionModal = ({ onClose, onSelect, parentNodeId, children }: AgentSelectionModalProps) => {
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    /* TODO: fetch agents from db to collect and display them. */

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Select an Agent</h2>
                {children}
            </div>
            <div className="agent-selector">
                {/* Search and Actions */}
                <div className="selector-actions">
                    <div className="search-container">
                        <CiSearch className="search-icon" />
                        <input type="text" placeholder="Search" value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <button className="new-button">New</button>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    <button className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}>
                        All Agents
                    </button>
                    <button className={`tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
                        My Agents
                    </button>
                    <button className={`tab ${activeTab === 'store' ? 'active' : ''}`}
                        onClick={() => setActiveTab('store')}>
                        Agent Store
                    </button>
                </div>

                {/* Agent Cards Grid */}
                <div className="agents-grid">
                    {/* Example agents - replace with actual data */}
                    <div
                        onClick={() => {
                            onSelect({ name: 'Rico', role: 'Researcher', parentNodeId });
                            onClose();
                        }}>
                        <AgentCard data={{ name: 'Rico', role: 'Researcher' }} />
                    </div>
                    <div
                        onClick={() => {
                            onSelect({ name: 'Becca', role: 'Researcher', parentNodeId });
                            onClose();
                        }}>
                        <AgentCard data={{ name: 'Becca', role: 'Researcher' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};
