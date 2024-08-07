import { useCallback } from 'react';
import { Handle } from '@xyflow/react';
import { Position } from '@xyflow/react';

import './automation-node.styles.css';

export const AutomationNode = ({ data, isConnectable }: any) => {
    const onChange = useCallback((event: any) => {
        console.log('Target value ->', event.target.value);
    }, []);

    return (
        <div className="automation-node">
            <Handle type="target" position={Position.Top} />
            <div>
                <label htmlFor="text">Text:</label>
                <input type="text" id="text" name="text" onChange={onChange} className="nodrag" />
            </div>
            <Handle type="source" position={Position.Bottom} id="a" isConnectable={isConnectable} />
            <Handle type="source" position={Position.Bottom} id="b" isConnectable={isConnectable} />
        </div>
    );
};
