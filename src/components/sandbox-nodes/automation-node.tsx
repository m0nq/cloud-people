import { Position } from '@xyflow/react';
import { ReactNode } from 'react';

import { AgentCard } from '@components/agents/agent-card';
import { NodeComponent } from '@components/utils/node-component/node-component';
import { HandleType } from './types.enum';
import './node.styles.css';

type AutomationNodeProps = {
    id: string;
    data: {
        onOpenModal?: () => void;
        [key: string]: any;
    };
    targetPosition?: string;
    sourcePosition?: string;
    isConnectable?: boolean;
    type?: string;
};

const getPosition = (position?: string): Position => {
    const positionMap = {
        left: Position.Left,
        right: Position.Right,
        bottom: Position.Bottom,
        top: Position.Top
    } as { [direction: string]: Position };

    return position && positionMap[position] || Position.Top;
};

const AutomationNode = ({
    id,
    data,
    isConnectable,
    sourcePosition,
    targetPosition
}: AutomationNodeProps): ReactNode => {

    const sPosition = getPosition(sourcePosition);
    const tPosition = getPosition(targetPosition);

    const handleClick = (type: HandleType) => {
        if (type === HandleType.SOURCE) {
            data?.onOpenModal?.();
        }
    };

    return (
        <NodeComponent.Root className="automation-node">
            <NodeComponent.Content>
                <AgentCard data={data} />
            </NodeComponent.Content>
            {/* progress bar */}
            {/* optional handles to connect bottom and top if nodes: are related? run in parallel? are dependent on each other? */}
            {/* possible styled handle extension as button or further detailed information */}
            <NodeComponent.Handle 
                onClick={() => handleClick(HandleType.SOURCE)}
                type={HandleType.SOURCE}
                position={sPosition} 
                id={`${id}-a`} 
                isConnectable={isConnectable} />
            <NodeComponent.Handle 
                type={HandleType.TARGET}
                position={tPosition} 
                id={`${id}-b`} 
                isConnectable={isConnectable} />
        </NodeComponent.Root>
    );
};

export default AutomationNode;
