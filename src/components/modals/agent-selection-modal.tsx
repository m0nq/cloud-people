import { useState } from 'react';
import { ReactNode } from 'react';

import './agent-selection-modal.styles.css';
import { AgentCard } from '@components/agents/agent-card';
import { AgentData } from '@lib/definitions';
import { AgentStatus } from '@lib/definitions';
import { useModalStore } from '@stores/modal-store';

interface AgentSelectionModalProps {
    parentNodeId: string;
    onClose: () => void;
    onSelect: (agentData: AgentData) => void;
    children: ReactNode;
}

export const AgentSelectionModal = ({ onClose, onSelect, parentNodeId, children }: AgentSelectionModalProps) => {
    const [activeTab, setActiveTab] = useState('agents');
    const { openModal } = useModalStore();

    /* TODO: fetch agents from db to collect and display them. */

    const handleClick = () => {
        openModal({ type: 'agent-config', parentNodeId, isFromModal: true });
    };

    return (
        <div className="agent-selector-container">
            <div className="agent-selector-header">
                <h2 className="text-xl font-semibold text-color-light">Add Agent</h2>
                <div className="selector-actions">
                    <button className="agent-builder-button" onClick={handleClick}>Agent Builder</button>
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
                    <div onClick={() => {
                        onSelect({ name: 'Rico', role: 'Researcher', parentNodeId });
                        onClose();
                    }}>
                        <AgentCard status={AgentStatus.Initial} data={{ name: 'Rico', role: 'Researcher' }} />
                    </div>
                    <div onClick={() => {
                        onSelect({ name: 'Becca', role: 'Researcher', parentNodeId });
                        onClose();
                    }}>
                        <AgentCard status={AgentStatus.Initial} data={{ name: 'Becca', role: 'Researcher' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};
