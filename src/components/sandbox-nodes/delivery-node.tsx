import React from 'react';

import './node.styles.css';
import { ClosedBoxIcon } from '@components/icons/closed-box-icon';

interface DeliveryNodeProps {
    id: string;
    // Add any other props you need
}

/*
* DeliveryNode will have 3 states to display between 2 svgs
* Delivery Pending: base colors already set
* Ready for Review: background: linear-gradient(89deg, #C1D6E7 14.21%, #E1E4EB 101.01%);
*   svg fill color: #2D3742
* Clicked State: background and svg fill of Ready for Review state, but use open-box-icon
* */
const DeliveryNode: React.FC<DeliveryNodeProps> = ({ id }) => {
    return (
        <div className="delivery-node" data-node-id={id}>
            <ClosedBoxIcon className="delivery-icon" />
        </div>
    );
};

export default DeliveryNode;
