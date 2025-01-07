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
    const { removeAgent, transition, getAgentState, updateAgent } = useAgentStore();
    const agentState = getAgentState(id);

    // Initialize agent when component mounts
    const handleInitialize = useCallback(() => {
        // Initialize agent with default state and provided status
        updateAgent(id, { status: data.status });
    }, [id, data.status, updateAgent]);

    useEffect(() => {
        handleInitialize();
        return () => {
            removeAgent(id);
        };
    }, [id, handleInitialize, removeAgent]);

    const handleAgentDetails = useCallback(() => {
        if (agentState?.isEditable) {
            openModal({ type: 'agent-details', parentNodeId: id });
        }
    }, [id, openModal, agentState?.isEditable]);

    const handleAgentSelector = useCallback(() => {
        if (agentState?.status === AgentStatus.Initial || agentState?.status === AgentStatus.Idle) {
            openModal({ type: 'agent-selection', parentNodeId: id });
        }
    }, [id, openModal, agentState?.status]);

    // this could make sense after user is notified an agent needs help and clicks on the agent for a modal
    const handleAssistanceRequest = useCallback(() => {
        transition(id, AgentStatus.Assistance, {
            assistanceMessage: 'Agent needs assistance to proceed with the task'
        });
        // openModal({ type: 'agent-assistance', parentNodeId: id });
    }, [id, openModal, transition]);

    // this is new...
    const handleRestart = useCallback(() => {
        transition(id, AgentStatus.Working, {
            progress: 0
        });
    }, [transition]);

    // Don't render until agent state is initialized
    if (!agentState) return null;

    return (
        <NodeComponent.Root className="agent-node">
            <NodeComponent.Content>
                <div onClick={handleAgentDetails}
                    className={`w-full h-full ${agentState.isEditable ? 'cursor-pointer' : 'cursor-default'}`}>
                    <AgentCard
                        data={data}
                        state={agentState}
                        status={agentState.status}
                        onEdit={agentState.isEditable ? handleAgentDetails : undefined}
                        onAssistanceRequest={handleAssistanceRequest}
                        onRestart={handleRestart} />
                </div>
            </NodeComponent.Content>
            <NodeComponent.Handle
                onClick={handleAgentSelector}
                type={HandleType.SOURCE}
                position={sPosition}
                id={`${id}-a`}
                // isConnectable={isConnectable && (agentState.status === AgentStatus.Initial || agentState.status ===
                // AgentStatus.Idle)}
                isConnectable={isConnectable}
                className={agentState.status === AgentStatus.Initial || agentState.status === AgentStatus.Idle ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} />
            <NodeComponent.Handle
                type={HandleType.TARGET}
                position={tPosition}
                id={`${id}-b`}
                // isConnectable={isConnectable && agentState.status !== AgentStatus.Complete}
                isConnectable={isConnectable}
                className={agentState.status !== AgentStatus.Complete ? undefined : 'opacity-50'} />
        </NodeComponent.Root>
    );
};

export default AgentNode;
