import { ReactNode } from 'react';
import { Handle } from '@xyflow/react';
import { Position } from '@xyflow/react';

import './node.styles.css';

type RootNodeProps = {
    id: string;
    data: any;
    targetPosition?: Position;
    sourcePosition?: Position;
    isConnectable?: boolean;
    type?: string;
};

export const RootNode = ({
    id,
    data,
    isConnectable,
    sourcePosition,
    targetPosition
}: RootNodeProps): ReactNode => {

    // needs state such that starts out in pause state (displays play icon)
    // when clicked, changes to play state (displays pause icon) and activates the workflow run state
    // when clicked (again), changes to pause state (displays pause icon) and pauses current workflow at whatever step
    // it's at

    return (
        <div className="root-node">
            {/*<AgentCard data={data} />*/}
            {/* optional handles to connect bottom and top if nodes: are related? run in parallel? are dependent on each other? */}
            {/* possible styled handle extension as button or further detailed information */}
            <Handle type="source" position={Position.Right} id={`${id}-a`} isConnectable={isConnectable} />
            {/*<Handle type="target" position={tPosition} id={`${id}-b`} isConnectable={isConnectable} />*/}
        </div>
    );
};
