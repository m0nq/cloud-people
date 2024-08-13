import { BaseEdge } from '@xyflow/react';
import { getSmoothStepPath } from '@xyflow/react';

export const AutomationEdge = ({ id, sourceX, sourceY, targetX, targetY }: any) => {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY
    });

    return (
        <>
            <BaseEdge id={id} path={edgePath} />
            {/* To add a custom label */}
            {/* <EdgeLabelRenderer></EdgeLabelRenderer> */}
        </>
    );
};
