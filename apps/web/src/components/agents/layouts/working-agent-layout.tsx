import { useEffect } from 'react';
import Image from 'next/image';

import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { BaseAgentLayoutProps } from './base-agent-layout';
import { Button } from '@components/utils/button/button';
import { ChatIcon } from '@components/icons/chat-icon';
import { TaskStatusIcon } from '@components/icons/task-status-icon';
import { WatchIcon } from '@components/icons/watch-icon';
import { useAgent } from '@hooks/use-agent';
import { useAgentStore } from '@stores/agent-store';

export const WorkingAgentLayout = ({ agentId }: BaseAgentLayoutProps) => {
    const { transition } = useAgentStore();
    const agentStore = useAgentStore();
    const agentData = agentStore.getAgentData(agentId);

    const {
        isProcessing,
        executeTask,
        pauseAgentExecution,
        error
    } = useAgent(agentId, (status) => {
        transition(agentId, status);
    });

    // Start execution when component mounts
    useEffect(() => {
        let isMounted = true;

        (async () => {
            try {
                // executeAction now handles both new tasks and resuming
                await executeTask();

                // If successful and we were resuming, reset the flag
                if (isMounted && agentData?.isResuming) {
                    useAgentStore.getState().setAgentData(agentId, {
                        ...agentData,
                        isResuming: false
                    });
                }
            } catch (error) {
                console.error(`Error during agent execution:`, error);
            }
        })();

        // Cleanup function
        return () => {
            isMounted = false;
        };

        // This needs to run only once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePause = async () => {
        await pauseAgentExecution(agentId, agentData, (status) => {
            transition(agentId, status);
        });
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
                        // onClick={handlePause}
                        icon={<WatchIcon width={15} height={15} />}>
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
