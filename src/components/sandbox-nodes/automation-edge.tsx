import { BaseEdge } from '@xyflow/react';
import { getSmoothStepPath } from '@xyflow/react';
import { EdgeProps } from '@xyflow/react';

import './node.styles.css';

export const AutomationEdge = ({
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    ...props
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
            <BaseEdge id={id} path={edgePath} className="automation-edge" {...props} />
            {/* To add a custom label - also takes any react component as a child */}
            {/* <EdgeLabelRenderer></EdgeLabelRenderer> */}
        </>
    );
};
