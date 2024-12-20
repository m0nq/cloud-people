import { ReactNode } from 'react';
import { Position } from '@xyflow/react';
import { FaPlay } from 'react-icons/fa';

import './node.styles.css';
import { NodeComponent } from '@components/utils/node-component/node-component';
import { HandleType } from './types.enum';
import { useModalStore } from '@stores/modal-store';
// import { FaPause } from 'react-icons/fa';

type RootNodeProps = {
    id: string;
    targetPosition?: Position;
    sourcePosition?: Position;
    isConnectable?: boolean;
    type?: string;
};

const RootNode = ({ id, isConnectable, sourcePosition, targetPosition }: RootNodeProps): ReactNode => {
    const openModal = useModalStore(state => state.openModal);

    // needs state such that starts out in pause state (displays play icon)
    // when clicked, changes to play state (displays pause icon) and activates the workflow run state
    // when clicked (again), changes to pause state (displays pause icon) and pauses current workflow at whatever step
    // it's at

    const handleClick = () => {
        openModal({ type: 'agent-selection', parentNodeId: id });
    };

    return (
        <NodeComponent.Root className="root-node">
            <button className="inner-circle" onClick={() => alert('Let\'s get this party started!!! 🥳')}>
                {/*  play and pause buttons go here  */}
                <FaPlay color={'#ffffff'} size={40} />
                {/*<FaPause color={'#ffffff'} size={40} />*/}
            </button>
            <NodeComponent.Handle onClick={handleClick}
                type={HandleType.SOURCE}
                position={Position.Right}
                id={`${id}-root`}
                isConnectable={isConnectable} />
        </NodeComponent.Root>
    );
};

export default RootNode;
