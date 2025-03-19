import { useCallback } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useMemo } from 'react';
import { Position } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';

import { AgentCard } from '@components/agents/agent-card';
import { NodeComponent } from '@components/utils/node-component/node-component';
import { useModalStore } from '@stores/modal-store';
import { useAgentStore } from '@stores/agent-store';
import { useWorkflowStore } from '@stores/workflow';
import { AgentState } from '@app-types/agent';
import { HandleType } from './types.enum';
import './node.styles.css';
import { WorkflowState } from '@app-types/workflow';
import type { NodeData } from '@app-types/workflow';
import { fetchAgent } from '@lib/actions/agent-actions';

const DEFAULT_AGENT_STATE = {
    state: AgentState.Working,
    isEditable: false,
    isLoading: false,
    error: null,
    progress: 0,
    assistanceMessage: null
};

type AgentNodeProps = {
    id: string;
    data: NodeData;
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
    const { openModal } = useModalStore();
    const {
        removeAgent,
        transition,
        getAgentState,
        updateAgentState,
        getAgentData,
        setAgentData
    } = useAgentStore();
    const { progressWorkflow, pauseWorkflow, workflowExecution, edges } = useWorkflowStore();

    // Memoize positions
    const sPosition = useMemo(() => getPosition(sourcePosition), [sourcePosition]);
    const tPosition = useMemo(() => getPosition(targetPosition), [targetPosition]);

    const [isLoadingData, setIsLoadingData] = useState(false);
    const agentId = data.agentRef?.agentId;

    // Use atomic selectors with useShallow for better performance
    const agentState = useAgentStore(
        useShallow(state => state.agentState[agentId] || DEFAULT_AGENT_STATE)
    );
    const { state, isEditable } = agentState;

    // Memoize agentData to prevent unnecessary rerenders
    const agentData = useMemo(() => getAgentData(agentId), [getAgentData, agentId]);

    // Combined effect for agent initialization and data fetching
    useEffect(() => {
        if (!agentId) return;

        // Initialize agent state
        if (data.state) {
            updateAgentState(agentId, {
                state: data.state,
                isEditable: true,
                isLoading: true
            });
        }

        // Only fetch if we don't have the data cached
        if (!agentData) {
            setIsLoadingData(true);
            fetchAgent({ agentId })
                .then(agentState => {
                    if (agentState) {
                        setAgentData(agentId, agentState);
                        updateAgentState(agentId, { isLoading: false });
                    }
                })
                .catch(error => {
                    console.error('Failed to fetch agent data:', error);
                    updateAgentState(agentId, {
                        isLoading: false,
                        state: AgentState.Error,
                        error: 'Failed to load agent data'
                    });
                })
                .finally(() => {
                    setIsLoadingData(false);
                });
        }

        return () => {
            removeAgent(agentId);
        };
    }, [agentId, data.state, getAgentData, removeAgent, setAgentData, updateAgentState, agentData]);

    // Memoize workflow state effect
    useEffect(() => {
        if (!state) return;

        if (state === AgentState.Complete) {
            progressWorkflow(id, state);
        } else if (state === AgentState.Error || state === AgentState.Assistance) {
            pauseWorkflow();
        }
    }, [state, id, progressWorkflow, pauseWorkflow, agentData]);

    // Memoize handlers
    const handleAgentDetails = useCallback(() => {
        if (isEditable) {
            openModal({ type: 'agent-details', parentNodeId: id });
        }
    }, [id, openModal, isEditable]);

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

    const handleAssistanceRequest = useCallback(() => {
        transition(id, AgentState.Assistance, {
            assistanceMessage: 'Agent needs assistance to proceed with the task'
        });
    }, [id, transition]);

    const handleRestart = useCallback(() => {
        transition(id, AgentState.Working, { progress: 0 });
    }, [id, transition]);

    // Memoize complex class names
    const containerClassName = useMemo(() =>
            `agent-node-container`,
        []
    );

    const contentClassName = useMemo(() =>
            `w-full h-full ${isEditable ? 'cursor-pointer' : 'cursor-default'}`,
        [isEditable]
    );

    const handleClassName = useMemo(() =>
            workflowExecution?.state === WorkflowState.Initial ||
            workflowExecution?.state === WorkflowState.Paused ?
                'cursor-not-allowed opacity-50' : 'cursor-pointer',
        [workflowExecution?.state]
    );

    // Memoize handle connectable state
    const isHandleConnectable = useMemo(() =>
            isConnectable ||
            workflowExecution?.state === WorkflowState.Initial ||
            workflowExecution?.state === WorkflowState.Paused,
        [isConnectable, workflowExecution?.state]
    );

    return (
        <NodeComponent.Root className="agent-node">
            <NodeComponent.Content className={containerClassName}>
                <div className={contentClassName} onClick={handleAgentDetails}>
                    <AgentCard agentId={agentId}
                        agentData={agentData}
                        state={state}
                        onEdit={isEditable ? handleAgentDetails : undefined}
                        onAssistanceRequest={handleAssistanceRequest}
                        onRestart={handleRestart} />
                </div>
            </NodeComponent.Content>
            <NodeComponent.Handle
                onClick={handleClick}
                type={HandleType.SOURCE}
                position={sPosition}
                id="source"
                isConnectable={isHandleConnectable}
                className={handleClassName} />
            <NodeComponent.Handle
                type={HandleType.TARGET}
                position={tPosition}
                id="target"
                data-handleid="target"
                isConnectable={isHandleConnectable}
                className={handleClassName} />
        </NodeComponent.Root>
    );
};

export default AgentNode;
