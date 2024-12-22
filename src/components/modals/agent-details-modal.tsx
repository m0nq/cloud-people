import { ReactNode } from 'react';

import './modal.styles.css';
import { SearchIcon } from '@components/icons/search-icon';
import { CheckMarkIcon } from '@components/icons/check-mark-icon';
import { SaveDocumentIcon } from '@components/icons/save-document-icon';
import { LogCard } from '@components/log-card/log-card';

interface AgentDetailsModalProps {
    onClose: () => void;
    children?: ReactNode;
    parentNodeId?: string;
}

export const AgentDetailsModal = ({ children }: AgentDetailsModalProps) => {
    return (
        <div className="agent-details-modal">
            <div className="agent-details-layout">
                {/* Left Column */}
                <div className="agent-details-left-column">{/* Content for left column will go here */}</div>

                {/* Right Column */}
                <div className="agent-details-right-column">
                    {/* Top Section with Search */}
                    <div className="agent-details-search">
                        <div className="search-container">
                            <div className="search-icon">
                                <SearchIcon color="#1C64F2" strokeWidth={1.5} />
                            </div>
                            <input type="text" placeholder="Search" className="search-input" />
                        </div>
                        {children}
                    </div>

                    {/* Middle Section - Flexible height */}
                    <div className="agent-details-content-section">
                        <LogCard>
                            {/* We'll add the proper content here later */}
                            Agent details will go here...
                        </LogCard>
                        <LogCard color="#9CA3AF">
                            {/* We'll add the proper content here later */}
                            {'<-'} More agent info will go there soon...
                        </LogCard>
                    </div>

                    {/* Bottom Section - Buttons */}
                    <div className="agent-details-buttons">
                        <button className="check-button">
                            <CheckMarkIcon width={18} height={18} color="white" />
                            Check
                        </button>
                        <button className="save-button">
                            <SaveDocumentIcon width={18} height={18} />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
