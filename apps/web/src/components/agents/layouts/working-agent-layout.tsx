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

export const WorkingAgentLayout = ({ agentId, agentData, onStatusChange }: WorkingAgentLayoutProps) => {
    // HOOKS MOVED TO TOP
    const { transition, getAgentData } = useAgentStore();
    const hasExecuted = useRef(false); // Ref to track execution
    const data = agentData || getAgentData(agentId);

    // Pass agentData directly to the hook
    const {
        isProcessing,
        executeTask,
        pauseAgentExecution,
        error,
        result
    } = useAgent(data, (status: AgentState) => {
        // agentId is needed for transition and the prop callback
        // Get it from the agentData prop passed to WorkingAgentLayout
        const currentAgentId = agentId;
        if (currentAgentId) {
            transition(currentAgentId, status);
            if (onStatusChange) {
                onStatusChange(currentAgentId, status);
            }
        }
    });

    // Moved useEffect hook up
    useEffect(() => {
        // Early return if no agent data or already executed
        if (!data || !data.id || hasExecuted.current) {
            return;
        }

        let isMounted = true;

        (async () => {
            console.log(`[WorkingAgentLayout] Executing task for agent: ${data.id}`);
            hasExecuted.current = true; // Mark as executed
            try {
                await executeTask(); // Execute the task
                if (isMounted) {
                    console.log(`[WorkingAgentLayout] Task completed for agent: ${data.id}`);
                }
            } catch (err) {
                if (isMounted) {
                    console.error(`[WorkingAgentLayout] Error executing task for agent ${data.id}:`, err);
                }
            }
        })();

        return () => {
            isMounted = false;
            // Optional: Add cleanup logic here if needed when the component unmounts
            // or when agentData changes causing the effect to re-run.
            // console.log(`[WorkingAgentLayout] Cleanup effect for agent: ${agentData?.id}`);
        };
    }, [data, executeTask]); // Add agentData and executeTask to dependency array

    // CONDITIONAL RETURN REMAINS, BUT AFTER HOOKS
    // Ensure agentData exists before rendering the main component body
    if (!data) {
        console.log(`[WorkingAgentLayout] Rendering Loading... because agentData prop is missing.`);
        // Return a loading indicator or null, preventing hook call with undefined
        return <div>Loading Agent Data...</div>;
    }

    // REST OF THE COMPONENT RENDER LOGIC
    const handlePause = () => {
        if (agentData?.id) {
            pauseAgentExecution();
        }
    };

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
