import { useMemo } from 'react';
import { useState } from 'react';

import { ClosedBoxIcon } from '@components/icons/closed-box-icon';
import { OpenBoxIcon } from '@components/icons/open-box-icon';

import './node.styles.css';

type DeliveryNodeState = 'pending' | 'ready' | 'open';

interface DeliveryNodeProps {
    id: string;
    className?: string;
}

/*
 * DeliveryNode will have 3 states to display between 2 svgs
 * Pending: base colors already set with ClosedBoxIcon
 * Ready: background gradient with ClosedBoxIcon
 * Open: background gradient with OpenBoxIcon
 */
const DeliveryNode = ({ id, className }: DeliveryNodeProps) => {
    const [state, setState] = useState<DeliveryNodeState>('pending');

    const nodeClassName = useMemo(() => {
        const baseClass = 'delivery-node';
        switch (state) {
            case 'ready':
                return `${baseClass} delivery-node-ready`;
            case 'open':
                return `${baseClass} delivery-node-open`;
            default:
                return baseClass;
        }
    }, [state]);

    const handleClick = () => {
        setState(currentState => {
            switch (currentState) {
                case 'pending':
                    return 'ready';
                case 'ready':
                    return 'open';
                default:
                    return 'pending';
            }
        });
    };

    const ariaLabel = useMemo(() => {
        switch (state) {
            case 'pending':
                return 'Delivery box pending';
            case 'ready':
                return 'Delivery box ready';
            case 'open':
                return 'Delivery box open';
        }
    }, [state]);

    return (
        <div className={className ? `${nodeClassName} ${className}` : nodeClassName}
            data-node-id={id}
            data-state={state}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label={ariaLabel}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}>
            {state === 'open' ? <OpenBoxIcon className="delivery-icon" aria-hidden="true" /> :
                <ClosedBoxIcon className="delivery-icon" aria-hidden="true" />}
        </div>
    );
};

export default DeliveryNode;
