import { Position } from '@xyflow/react';
import { ReactNode } from 'react';

import './node.styles.css';
import { AgentCard } from '@components/agents/agent-card';
import { NodeComponent } from '@components/utils/node-component/node-component';
import { HandleType } from './types.enum';
import { useModalStore } from '@stores/modal-store';

type AgentNodeProps = {
    id: string;
    data: {
        name: string;
        role: string;
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

    return (position && positionMap[position]) || Position.Top;
};

const AgentNode = ({ id, data, isConnectable, sourcePosition, targetPosition }: AgentNodeProps): ReactNode => {
    const sPosition = getPosition(sourcePosition);
    const tPosition = getPosition(targetPosition);
    const { openModal } = useModalStore();

    return (
        <NodeComponent.Root className="agent-node">
            <NodeComponent.Content>
                <div onClick={() => openModal({ type: 'agent-details', parentNodeId: id })} className="w-full h-full cursor-pointer">
                    <AgentCard data={data} />
                </div>
            </NodeComponent.Content>
            {/* progress bar */}
            {/* optional handles to connect bottom and top if nodes: are related? run in parallel? are dependent on each other? */}
            {/* possible styled handle extension as button or further detailed information */}
            <NodeComponent.Handle
                onClick={() => openModal({ type: 'agent-selection', parentNodeId: id })}
                type={HandleType.SOURCE}
                position={sPosition}
                id={`${id}-a`}
                isConnectable={isConnectable}
            />
            <NodeComponent.Handle type={HandleType.TARGET} position={tPosition} id={`${id}-b`} isConnectable={isConnectable} />
        </NodeComponent.Root>
    );
};

export default AgentNode;
