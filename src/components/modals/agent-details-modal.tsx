import { ReactNode } from 'react';
// import Image from 'next/image';
import './modal.styles.css';
import { SearchIcon } from '@components/icons/search-icon';
import { CheckMarkIcon } from '@components/icons/check-mark-icon';
import { SaveDocumentIcon } from '@components/icons/save-document-icon';
import { LogCard } from '@components/log-card/log-card';
import { Button } from '@components/utils/button/button';

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
                            <div className="agent-details-section">
                                <div className="gap-4">
                                    {/*<Image className="w-8 h-8 rounded-full"*/}
                                    {/*    alt="Cloud Head Avatar"*/}
                                    {/*    width={2}*/}
                                    {/*    height={2}*/}
                                    {/*    src="" />*/}
                                    <div className="avatar bg-[#111212] "></div>
                                    {/* Agent avatar */}
                                    <div className="agent-name items-start">
                                        <h3>Mike</h3>
                                        <h3>Manager</h3>
                                    </div>
                                </div>
                                <div>
                                    <span className="agent-stat-title">Time on Task</span>
                                    <span className="agent-stat">30:42</span>
                                </div>
                                <div>
                                    <span className="agent-stat-title">Spend</span>
                                    <span className="agent-stat">$0.36</span>
                                </div>
                                <div>
                                    <span className="agent-stat-title">Accuracy</span>
                                    <span className="agent-stat">83%</span>
                                </div>
                                <div>
                                    <span className="agent-stat-title">Training Hours</span>
                                    <span className="agent-stat">342</span>
                                </div>
                            </div>
                            <Button variant="primary" size="md" fullWidth>
                                Settings
                            </Button>
                        </div>
                        <div className="top-section-area bg-[#111212] ">{/* Area 2 content */}</div>
                        <div className="top-section-area bg-[#111212] ">{/* Area 3 content */}</div>
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
                        <Button variant="primary" size="md" fullWidth icon={<CheckMarkIcon width={18} height={18} color="white" />}>
                            Check
                        </Button>
                        <Button variant="secondary" size="md" fullWidth icon={<SaveDocumentIcon width={18} height={18} />}>
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
