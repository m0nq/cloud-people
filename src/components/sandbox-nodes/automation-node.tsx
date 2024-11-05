import { ReactNode } from 'react';
import { Position } from '@xyflow/react';

import './node.styles.css';
import { AgentCard } from '@components/agents/agent-card';
import { NodeComponent } from '@components/utils/node-component/node-component';

type AutomationNodeProps = {
    id: string;
    data: any;
    targetPosition?: Position;
    sourcePosition?: Position;
    isConnectable?: boolean;
    type?: string;
};

const AutomationNode = ({
    id,
    data,
    isConnectable,
    sourcePosition,
    targetPosition
}: AutomationNodeProps): ReactNode => {

    let sPosition = Position.Top;
    switch (sourcePosition) {
        case 'left':
            sPosition = Position.Left;
            break;
        case 'right':
            sPosition = Position.Right;
            break;
        case 'bottom':
            sPosition = Position.Bottom;
            break;
    }

    let tPosition = Position.Top;
    switch (targetPosition) {
        case 'left':
            tPosition = Position.Left;
            break;
        case 'right':
            tPosition = Position.Right;
            break;
        case 'bottom':
            tPosition = Position.Bottom;
            break;
    }

    return (
        <NodeComponent.Root className="automation-node">
            <AgentCard data={data} />
            {/* progress bar */}
            {/* optional handles to connect bottom and top if nodes: are related? run in parallel? are dependent on each other? */}
            {/* possible styled handle extension as button or further detailed information */}
            <NodeComponent.Handle type="source" position={sPosition} id={`${id}-a`} isConnectable={isConnectable} />
            <NodeComponent.Handle type="target" position={tPosition} id={`${id}-b`} isConnectable={isConnectable} />
        </NodeComponent.Root>
    );
};

export default AutomationNode;
