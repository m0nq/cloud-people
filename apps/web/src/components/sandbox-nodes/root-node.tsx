import { ReactNode } from 'react';
import { useCallback } from 'react';
import { Position } from '@xyflow/react';
import { FaPlay } from 'react-icons/fa';
import { FaPause } from 'react-icons/fa';

import { NodeComponent } from '@components/utils/node-component/node-component';
import { HandleType } from './types.enum';
import { useModalStore } from '@stores/modal-store';
import { useWorkflowStore } from '@stores/workflow';
import { WorkflowState } from '@app-types/workflow';

import './node.styles.css';

type RootNodeProps = {
    id: string;
    targetPosition?: Position;
    sourcePosition?: Position;
    isConnectable?: boolean;
    type?: string;
};

const RootNode = ({ id, isConnectable, sourcePosition, targetPosition }: RootNodeProps): ReactNode => {
    const { openModal } = useModalStore();
    const { startWorkflow, pauseWorkflow, resumeWorkflow, workflowExecution, edges } = useWorkflowStore();

    const handlePlayPause = useCallback(async () => {
        if (!workflowExecution) {
            await startWorkflow();
        } else if (workflowExecution.state === WorkflowState.Running) {
            await pauseWorkflow();
        } else if (workflowExecution.state === WorkflowState.Paused) {
            await resumeWorkflow();
        } else if (workflowExecution.state === WorkflowState.Initial) {
            await startWorkflow();
        }
    }, [workflowExecution, startWorkflow, pauseWorkflow, resumeWorkflow]);

    const handleClick = useCallback(() => {
        // Check if this node already has a child
        const existingChildren = edges.filter(edge => edge.source === id);

        // TODO: Parallel node execution will be implemented in a future update.
        // For now, we restrict each node to having at most one child to maintain
        // a simple linear workflow structure.
        if (existingChildren.length >= 1) {
            alert('Node already has a child. Parallel execution is not yet supported.');
            return;
        }

        openModal({ type: 'agent-selection', parentNodeId: id });
    }, [id, openModal, edges]);

    return (
        <NodeComponent.Root className="root-node">
            <button className="inner-circle" onClick={handlePlayPause}>
                {workflowExecution?.state === WorkflowState.Running ? (
                    <FaPause color={'#ffffff'} size={40} />
                ) : (
                    <FaPlay color={'#ffffff'} size={40} />
                )}
            </button>
            <NodeComponent.Handle
                onClick={handleClick}
                type={HandleType.SOURCE}
                position={Position.Right}
                id={`${id}-root`}
                isConnectable={isConnectable && (!workflowExecution || (workflowExecution?.state !== WorkflowState.Running && workflowExecution?.state === WorkflowState.Paused))} />
        </NodeComponent.Root>
    );
};

export default RootNode;
