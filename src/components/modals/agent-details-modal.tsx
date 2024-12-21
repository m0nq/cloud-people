import './modal.styles.css';
import { SearchIcon } from '@components/icons/search-icon';
import { CheckMarkIcon } from '@components/icons/check-mark-icon';
import { SaveDocumentIcon } from '@components/icons/save-document-icon';

interface AgentDetailsModalProps {
    onClose: () => void;
    children?: React.ReactNode;
    parentNodeId?: string;
}

export const AgentDetailsModal = ({ onClose, children }: AgentDetailsModalProps) => {
    return (
        <div className="agent-details-modal h-full max-h-[90vh] p-4">
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
                    <div className="agent-details-content-section">{/* Content for middle section */}</div>

                    {/* Bottom Section - Buttons */}
                    <div className="agent-details-buttons">
                        <button className="check-button">
                            <CheckMarkIcon width={11} height={11} color="white" />
                            Check
                        </button>
                        <button className="save-button">
                            <SaveDocumentIcon width={11} height={11} />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
