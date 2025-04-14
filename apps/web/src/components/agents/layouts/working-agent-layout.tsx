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
import { AgentState } from '@app-types/agent';
import { AgentData } from '@app-types/agent';

interface WorkingAgentLayoutProps extends BaseAgentLayoutProps {
    agentData?: AgentData;
    onStatusChange?: (agentId: string, newState: AgentState) => void;
}

export const WorkingAgentLayout = ({ agentData, onStatusChange }: WorkingAgentLayoutProps) => {
    const { transition } = useAgentStore();

    // Ensure agentData exists before calling the hook
    // If agentData is undefined, perhaps render a loading state or handle appropriately
    if (!agentData) {
        console.log(`[WorkingAgentLayout] Rendering Loading... because agentData prop is missing.`);
        // Return a loading indicator or null, preventing hook call with undefined
        return <div>Loading Agent Data...</div>;
    }

    const {
        isProcessing,
        executeTask,
        pauseAgentExecution,
        error,
        result
        // Pass agentData directly to the hook
    } = useAgent(agentData, (status: AgentState) => {
        // agentId is needed for transition and the prop callback
        // Get it from the agentData prop passed to WorkingAgentLayout
        const currentAgentId = agentData?.id;
        if (currentAgentId) {
            transition(currentAgentId, status);
            if (onStatusChange) {
                onStatusChange(currentAgentId, status);
            }
        }
    });

    // Start execution when component mounts
    const hasExecuted = useRef(false); // Ref to track execution
    useEffect(() => {
        // Early return if no agent data or already executed
        if (!agentData || !agentData.id || hasExecuted.current) {
            return;
        }

        let isMounted = true;

        (async () => {
            try {
                // executeAction now handles both new tasks and resuming
                await executeTask();

                // If successful and we were resuming, reset the flag
                if (isMounted && agentData?.isResuming) {
                    useAgentStore.getState().setAgentData(agentData.id, {
                        ...agentData,
                        isResuming: false
                    });
                }
            } catch (error) {
                console.error(`Error during agent execution:`, error);
            }
        })();

        // Mark as executed *before* the async call to prevent race conditions
        hasExecuted.current = true;

        // Cleanup function
        return () => {
            isMounted = false;
        };

        // This needs to run only once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePause = async () => {
        await pauseAgentExecution();
    };

    if (!agentData || !agentData.id) {
        console.log(`[WorkingAgentLayout ${agentData?.id}] Rendering Loading... because agentData prop is missing.`);
        return <div>Loading Agent...</div>;
    }

    return (
        <div className="working-agent-card">
            <div className="working-agent-wrapper">
                {/* Content */}
                <div className="agent-info-section">
                    <Image src={agentData?.image || cloudHeadImage}
                        alt={`Profile avatar of ${agentData?.name}`}
                        className="rounded-full"
                        width={48}
                        height={48} />
                    <div className="agent-name">
                        <span>{agentData?.name}</span>
                    </div>
                </div>

                {/* Status section */}
                <div className="agent-tasks-section">
                    <div className="agent-tasks-title">
                        <TaskStatusIcon />
                        <span>Current Task:</span>
                    </div>
                    <div className="agent-tasks-container">
                        <p>{isProcessing && 'Processing...'}</p>
                    </div>
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
