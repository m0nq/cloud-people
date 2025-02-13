import { useCallback } from 'react';
import { useEffect } from 'react';
import { useMemo } from 'react';

import { Position } from '@xyflow/react';

import { AgentCard } from '@components/agents/agent-card';
import { NodeComponent } from '@components/utils/node-component/node-component';
import { useModalStore } from '@stores/modal-store';
import { useAgentStore } from '@stores/agent-store';
import { useWorkflowStore } from '@stores/workflow';
import { AgentStatus } from '@app-types/agent';
import { AgentCapability } from '@app-types/agent';
import { AgentConfig } from '@app-types/agent';

import { useAgent } from '@hooks/use-agent';
import { HandleType } from './types.enum';
import './node.styles.css';

type AgentNodeProps = {
    id: string;
    data: {
        name: string;
        role: string;
        image?: string;
        capability: AgentCapability;
        config: AgentConfig;
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

const AgentNode = ({ id, data, isConnectable, sourcePosition, targetPosition }: AgentNodeProps) => {
    const sPosition = getPosition(sourcePosition);
    const tPosition = getPosition(targetPosition);
    const { openModal } = useModalStore();
    const { removeAgent, transition, getAgentState, updateAgent } = useAgentStore();
    const { progressWorkflow, isCurrentNode, pauseWorkflow } = useWorkflowStore();
    const agentState = getAgentState(id) || {
        status: AgentStatus.Initial,
        isEditable: true,
        isLoading: true
    };
    const isCurrentWorkflowNode = isCurrentNode(id);

    const agentData = useMemo(() => ({
            ...data,
            id,
            capability: data.capability || {
                action: 'navigate_to_google',
                parameters: {},
                description: 'Navigate to Google search'
            }
        }),
        [data, id]
    );

    const { executeAction, isProcessing, messages } = useAgent(id, status => {
        transition(id, status);
        // Only update workflow progress for terminal states
        if (status === AgentStatus.Complete) {
            progressWorkflow(id, status);
        } else if (status === AgentStatus.Error || status === AgentStatus.Assistance) {
            pauseWorkflow();
        }
    });

    useEffect(() => {
        if (isCurrentWorkflowNode && agentState?.status === AgentStatus.Working) {
            executeAction();
        }
    }, [isCurrentWorkflowNode, agentState?.status, executeAction]);

    const handleInitialize = useCallback(() => {
        // Only initialize if not already initialized
        if (!getAgentState(id)) {
            updateAgent(id, {
                status: data.status || AgentStatus.Initial,
                isEditable: true
            });
        }
    }, [id, data.status, getAgentState, updateAgent]);

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

    const handleOpenAgentSelection = useCallback(() => {
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
        // }, [id, openModal, transition]);
    }, [id, transition]);

    const handleRestart = useCallback(() => {
        transition(id, AgentStatus.Working, {
            progress: 0
        });
    }, [id, transition]);

    return (
        <NodeComponent.Root className="agent-node">
            <NodeComponent.Content className={`agent-node-container ${agentState.isLoading ? 'opacity-50' : ''}`}>
                <div className={`w-full h-full ${agentState.isEditable ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={handleAgentDetails}>
                    <AgentCard data={agentData}
                        state={agentState}
                        status={agentState.status}
                        onEdit={agentState.isEditable ? handleAgentDetails : undefined}
                        onAssistanceRequest={handleAssistanceRequest}
                        onRestart={handleRestart} />
                </div>
            </NodeComponent.Content>
            <NodeComponent.Handle
                onClick={handleOpenAgentSelection}
                type={HandleType.SOURCE}
                position={sPosition}
                id="source"
                data-handleid="source"
                isConnectable={isConnectable}
                className={agentState.status === AgentStatus.Initial || agentState.status === AgentStatus.Idle ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} />
            <NodeComponent.Handle
                type={HandleType.TARGET}
                position={tPosition}
                id="target"
                data-handleid="target"
                isConnectable={isConnectable}
                className={agentState.status !== AgentStatus.Complete ? undefined : 'opacity-50'} />
        </NodeComponent.Root>
    );
};

export default AgentNode;
