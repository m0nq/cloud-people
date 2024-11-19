import { ReactNode } from 'react';
import { Position } from '@xyflow/react';

import './node.styles.css';
import { FaPlay } from 'react-icons/fa';
import { NodeComponent } from '@components/utils/node-component/node-component';
// import { FaPause } from 'react-icons/fa';

type RootNodeProps = {
    id: string;
    data: {
        onOpenModal?: () => void;
    };
    targetPosition?: Position;
    sourcePosition?: Position;
    isConnectable?: boolean;
    type?: string;
};

const RootNode = ({
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

    const handleClick = () => {
        data?.onOpenModal?.();
    };

    return (
        <NodeComponent.Root className="root-node">
            <button className="inner-circle" onClick={() => alert('Let\'s get this party started!!! 🥳')}>
                {/*  play and pause buttons go here  */}
                <FaPlay color={'#ffffff'} size={40} />
                {/*<FaPause color={'#ffffff'} size={40} />*/}
            </button>
            <NodeComponent.Handle onClick={handleClick}
                type="source"
                position={Position.Right}
                id={`${id}-root`}
                isConnectable={isConnectable} />
        </NodeComponent.Root>
    );
};

export default RootNode;
