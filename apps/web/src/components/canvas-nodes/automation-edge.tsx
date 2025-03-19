import { BaseEdge } from '@xyflow/react';
import { getSmoothStepPath } from '@xyflow/react';
import { EdgeProps } from '@xyflow/react';

import './node.styles.css';

const AutomationEdge = ({
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    animated
}: EdgeProps) => {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition
    });

    return (
        <>
            <BaseEdge id={id} path={edgePath} className={`automation-edge ${animated ? 'animated' : ''}`} />
            {/* To add a custom label - also takes any react component as a child */}
            {/* <EdgeLabelRenderer></EdgeLabelRenderer> */}
        </>
    );
};

export default AutomationEdge;
