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
    const agentStore = useAgentStore();

    // Initialize agent store when component mounts, using useCallback to memoize the initialization function
    const handleInitialize = useCallback(() => {
        initializeAgent(id);
    }, [id, initializeAgent]);

    useEffect(() => {
        handleInitialize();
        return () => {
            removeAgent(id);
        };
    }, [id, handleInitialize, removeAgent]);

    const handleAgentDetails = useCallback(() => {
        if (agentStore?.isEditable) {
            openModal({ type: 'agent-details', parentNodeId: id });
        }
    }, [id, openModal, agentStore?.isEditable]);

    const handleAgentSelector = useCallback(() => {
        if (agentStore?.status === AgentStatus.Initial || agentStore?.status === AgentStatus.Idle) {
            openModal({ type: 'agent-selection', parentNodeId: id });
        }
    }, [id, openModal, agentStore?.status]);

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

    // Don't render until agentStore is initialized
    if (!agentStore) return null;

    return (
        <NodeComponent.Root className="agent-node">
            <NodeComponent.Content>
                <div onClick={handleAgentDetails}
                    className={`w-full h-full ${agentStore.isEditable ? 'cursor-pointer' : 'cursor-default'}`}>
                    <AgentCard
                        data={data}
                        state={agentStore}
                        status={agentStore.status}
                        onEdit={agentStore.isEditable ? handleAgentDetails : undefined}
                        onAssistanceRequest={handleAssistanceRequest}
                        onRestart={handleRestart} />
                </div>
            </NodeComponent.Content>
            <NodeComponent.Handle
                onClick={handleAgentSelector}
                type={HandleType.SOURCE}
                position={sPosition}
                id={`${id}-a`}
                // isConnectable={isConnectable && (agentStore.status === AgentStatus.Initial || agentStore.status ===
                // AgentStatus.Idle)}
                isConnectable={isConnectable}
                className={agentStore.status === AgentStatus.Initial || agentStore.status === AgentStatus.Idle ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} />
            <NodeComponent.Handle
                type={HandleType.TARGET}
                position={tPosition}
                id={`${id}-b`}
                // isConnectable={isConnectable && agentStore.status !== AgentStatus.Complete}
                isConnectable={isConnectable}
                className={agentStore.status !== AgentStatus.Complete ? undefined : 'opacity-50'} />
        </NodeComponent.Root>
    );
};

export default AgentNode;
