import { useState } from 'react';
import { ReactElement } from 'react';
import { CiSearch } from 'react-icons/ci';
import { IoCloseOutline } from 'react-icons/io5';

import './agent-selection-modal.styles.css';
import { AgentCard } from '@components/agents/agent-card';
import { AgentData } from '@lib/definitions';

type AgentSelectionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (agentData: AgentData) => void;
}

const AgentSelectionModal = ({ isOpen, onClose, onSelect }: AgentSelectionModalProps): ReactElement => {
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                {/* Header */}
                <div className="modal-header">
                    <h2>Add Agent</h2>
                    <div className="modal-actions">
                        <div className="search-container">
                            <CiSearch className="search-icon" />
                            <input type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <button className="new-button">New</button>
                        <button className="close-button" onClick={onClose}>
                            <IoCloseOutline />
                        </button>
                    </div>
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
                    <div onClick={() => onSelect({ name: 'Rico' })}>
                        <AgentCard data={{ name: 'Rico', role: 'Researcher' }} />
                    </div>
                    <div onClick={() => onSelect({ name: 'Becca' })}>
                        <AgentCard data={{ name: 'Becca', role: 'Researcher' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentSelectionModal;
