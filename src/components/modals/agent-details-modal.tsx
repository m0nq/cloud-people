import React from 'react';

interface AgentDetailsModalProps {
    onClose: () => void;
    children?: React.ReactNode;
    parentNodeId?: string;
}

export const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({ onClose, children, parentNodeId }) => {
    return (
        <div className="agent-details-modal">
            {children}
            {/* Content will be added in subsequent steps */}
        </div>
    );
};
