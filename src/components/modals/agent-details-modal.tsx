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
            <div className="agent-details-container">
                {/* Left Column */}
                <div className="agent-details-left-column">
                    <div className="left-column-top-section">
                        <div className="top-section-area">
                            {/* Agent info will go here */}
                            <div>
                                <div>
                                    {/* Agent avatar */}
                                    <h3>Mike Manager</h3>
                                </div>
                                <div>
                                    <span>Time on Task</span>
                                    <span>30:42</span>
                                </div>
                                <div>
                                    <span>Spend</span>
                                    <span>$0.36</span>
                                </div>
                                <div>
                                    <span>Accuracy</span>
                                    <span>83%</span>
                                </div>
                                <div>
                                    <span>Accuracy</span>
                                    <span>83%</span>
                                </div>
                            </div>
                            <button className="settings-button">
                                Settings
                            </button>
                        </div>
                        <div className="top-section-area">{/* Area 2 content */}</div>
                        <div className="top-section-area">{/* Area 3 content */}</div>
                    </div>
                    <div className="left-column-bottom-section">{/* Content for bottom section */}</div>
                </div>

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
                        <LogCard color="#ffffff">
                            {/* We'll add the proper content here later */}
                            Agent details will go here...
                        </LogCard>
                        <LogCard>
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
