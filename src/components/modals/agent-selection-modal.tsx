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
    const [activeTab, setActiveTab] = useState('agents');

    /* TODO: fetch agents from db to collect and display them. */

    return (
        <div className="agent-selector-container">
            <div className="agent-selector-header">
                <h2 className="text-xl font-semibold text-color-light">Add Agent</h2>
                <div className="selector-actions">
                    <button className="agent-builder-button">Agent Builder</button>
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
