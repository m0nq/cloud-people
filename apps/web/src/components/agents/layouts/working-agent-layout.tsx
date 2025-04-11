import { useEffect, useRef } from 'react';
import Image from 'next/image';

import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { BaseAgentLayoutProps } from './base-agent-layout';
import { Button } from '@components/utils/button/button';
import { ChatIcon } from '@components/icons/chat-icon';
import { TaskStatusIcon } from '@components/icons/task-status-icon';
import { useAgent } from '@hooks/use-agent';
import { useAgentStore } from '@stores/agent-store';
import { PauseIcon } from '@components/icons';
import { useWorkflowStore } from '@stores/workflow';
import { AgentState } from '@app-types/agent/state';

export const WorkingAgentLayout = ({ agentId }: BaseAgentLayoutProps) => {
    const hasExecutedRef = useRef(false);
    const displayAgentData = useAgentStore((state) => state.agentData[agentId]);

    const {
        isProcessing,
        executeTask,
        pauseAgentExecution,
        error,
        result
    } = useAgent(agentId, (status) => {
        const agentStoreState = useAgentStore.getState();
        const currentAgentData = agentStoreState.agentData[agentId];
        const transitionFunc = agentStoreState.transition;

        transitionFunc(agentId, status);

        if (status === AgentState.Complete && currentAgentData?.nodeId) {
            console.log(`[WorkingAgentLayout] Agent ${agentId} (Node ${currentAgentData.nodeId}) completed. Calling progressWorkflow.`);
            useWorkflowStore.getState().progressWorkflow(currentAgentData.nodeId, status);
        } else {
            console.log(`[WorkingAgentLayout] Agent ${agentId} status changed to ${status}. (Not COMPLETE or nodeId missing - Not progressing workflow)`);
        }
    });

    useEffect(() => {
        const agentStoreState = useAgentStore.getState();
        const dataForEffect = agentStoreState.agentData[agentId];

        if (!dataForEffect || !dataForEffect.id || hasExecutedRef.current) {
            return;
        }

        let isMounted = true;
        hasExecutedRef.current = true;

        (async () => {
            try {
                await executeTask();

                if (isMounted && dataForEffect?.isResuming) {
                    useAgentStore.getState().setAgentData(agentId, {
                        ...dataForEffect,
                        isResuming: false
                    });
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Error executing task in layout:", err);
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [agentId, executeTask]);

    const handlePause = async () => {
        if (!displayAgentData) {
            console.error("Cannot pause: Agent data not available.");
            return;
        }
        await pauseAgentExecution(agentId, displayAgentData, (status) => {
            useAgentStore.getState().transition(agentId, status);
        });
    };

    if (!displayAgentData || !displayAgentData.id) {
        return <div>Loading...</div>;
    }

    return (
        <div className="working-agent-card">
            <div className="working-agent-wrapper">
                <div className="agent-info-section">
                    <Image src={displayAgentData?.image || cloudHeadImage}
                        alt={`Profile avatar of ${displayAgentData?.name}`}
                        className="rounded-full"
                        width={48}
                        height={48} />
                    <div className="agent-name">
                        <span>{displayAgentData?.name}</span>
                    </div>
                </div>

                <div className="agent-tasks-section">
                    <div className="agent-tasks-title">
                        <TaskStatusIcon />
                        <span>Task Status</span>
                    </div>
                    <div className="agent-task-status-content">
                        {error ? (
                            <div className="text-red-500">
                                Error: {error}
                            </div>
                        ) : isProcessing ? (
                            <div className="flex items-center">
                                <span>Processing...</span>
                            </div>
                        ) : (
                            <div className="break-words">
                                {result || 'Awaiting execution...'}
                            </div>
                        )}
                    </div>
                    {isProcessing && (
                        <Button
                            onClick={handlePause}
                            className="absolute bottom-2 right-2"
                        >
                            <PauseIcon className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <div className="buttons-container">
                    <Button customStyles={{ textColor: '#7d829a', backgroundColor: '#232629' }}
                        variant="primary"
                        size="sm"
                        radius="lg"
                        fullWidth
                        onClick={handlePause}
                        icon={<PauseIcon width={15} height={15} />}>
                        Watch
                    </Button>
                    <Button variant="secondary"
                        size="sm"
                        radius="lg"
                        customStyles={{ textColor: '#2f3338', backgroundColor: '#56e8cd' }}
                        fullWidth
                        icon={<ChatIcon />}>
                        Meeting
                    </Button>
                </div>
            </div>
        </div>
    );
};
