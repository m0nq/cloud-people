import './modal.styles.css';

interface AgentDetailsModalProps {
    onClose: () => void;
    children?: React.ReactNode;
    parentNodeId?: string;
}

export const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({ onClose, children }) => {
    return (
        <div className="agent-details-modal h-full max-h-[90vh] p-4">
            <div className="flex gap-4 h-full w-full">
                {/* Left Column */}
                <div className="flex-1 bg-[#111212] rounded-lg h-full overflow-auto">{/* Content for left column will go here */}</div>

                {/* Right Column */}
                <div className="flex flex-col items-start w-96 h-full px-[0.0625rem] bg-[#111212] rounded-lg gap-2 overflow-auto">
                    {children}
                    {/* Content for right column will go here */}
                </div>
            </div>
        </div>
    );
};
