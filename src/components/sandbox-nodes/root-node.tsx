import { ReactNode } from 'react';
import { Handle } from '@xyflow/react';
import { Position } from '@xyflow/react';

import './node.styles.css';
import { FaPlay } from 'react-icons/fa';
// import { FaPause } from 'react-icons/fa';

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
            <div className="inner-circle">
                {/*  play and pause buttons go here  */}
                <FaPlay color={'#ffffff'} size={40} />
                {/*<FaPause color={'#ffffff'} size={40} />*/}
            </div>
            <Handle type="source" position={Position.Right} id={`${id}-root`} isConnectable={isConnectable} />
        </div>
    );
};
