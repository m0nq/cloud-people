import { Position } from '@xyflow/react';
import { ReactNode } from 'react';
import { useCallback } from 'react';
import { useEffect } from 'react';

import './node.styles.css';
import { AgentCard } from '@components/agents/agent-card';
import { NodeComponent } from '@components/utils/node-component/node-component';
import { HandleType } from './types.enum';
import { useModalStore } from '@stores/modal-store';
import { useAgentStore } from '@stores/agent-store';
import { AgentStatus } from '@lib/definitions';

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
    const { initializeAgent, removeAgent, transition } = useAgentStore();

    const state = useAgentStore();

    // Initialize agent state when component mounts, using useCallback to memoize the initialization function
    const handleInitialize = useCallback(() => {
        initializeAgent(id);
    }, [id, initializeAgent]);

    useEffect(() => {
        handleInitialize();
        return () => {
            removeAgent(id);
        };
    }, [id, handleInitialize, removeAgent]);

    // Get agent state and actions using selectors

    const handleAgentDetails = useCallback(() => {
        if (state?.isEditable) {
            openModal({ type: 'agent-details', parentNodeId: id });
        }
    }, [id, openModal, state?.isEditable]);

    const handleAgentSelection = useCallback(() => {
        if (state?.status === AgentStatus.Initial || state?.status === AgentStatus.Idle) {
            openModal({ type: 'agent-selection', parentNodeId: id });
        }
    }, [id, openModal, state?.status]);

    const handleAssistanceRequest = useCallback(() => {
        transition(id, AgentStatus.Assistance, {
            assistanceMessage: 'Agent needs assistance to proceed with the task'
        });
        openModal({ type: 'agent-assistance', parentNodeId: id });
    }, [id, openModal, transition]);

    const handleRestart = useCallback(() => {
        transition(id, AgentStatus.Working, {
            progress: 0
        });
    }, [transition]);

    // Don't render until state is initialized
    if (!state) return null;

    return (
        <NodeComponent.Root className="agent-node">
            <NodeComponent.Content>
                <div onClick={handleAgentDetails}
                    className={`w-full h-full ${state.isEditable ? 'cursor-pointer' : 'cursor-default'}`}>
                    <AgentCard
                        data={data}
                        state={state}
                        onEdit={state.isEditable ? handleAgentDetails : undefined}
                        onAssistanceRequest={handleAssistanceRequest}
                        onRestart={handleRestart}
                    />
                </div>
            </NodeComponent.Content>
            <NodeComponent.Handle
                onClick={handleAgentSelection}
                type={HandleType.SOURCE}
                position={sPosition}
                id={`${id}-a`}
                isConnectable={isConnectable && (state.status === AgentStatus.Initial || state.status === AgentStatus.Idle)}
                className={state.status === AgentStatus.Initial || state.status === AgentStatus.Idle ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
            />
            <NodeComponent.Handle
                type={HandleType.TARGET}
                position={tPosition}
                id={`${id}-b`}
                isConnectable={isConnectable && state.status !== AgentStatus.Complete}
                className={state.status !== AgentStatus.Complete ? undefined : 'opacity-50'}
            />
        </NodeComponent.Root>
    );
};

export default AgentNode;
