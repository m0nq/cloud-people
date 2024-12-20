import React from 'react';

import './node.styles.css';
import { ClosedBoxIcon } from '@components/icons/closed-box-icon';

interface DeliveryNodeProps {
    id: string;
    // Add any other props you need
}

const DeliveryNode: React.FC<DeliveryNodeProps> = ({ id }) => {
    return (
        <div className="delivery-node" data-node-id={id}>
            <ClosedBoxIcon className="delivery-icon" />
        </div>
    );
};

export default DeliveryNode;
