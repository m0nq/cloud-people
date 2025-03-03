import { useState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import Image from 'next/image';

import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { BaseAgentLayoutProps } from './base-agent-layout';
import { Button } from '@components/utils/button/button';
import { ChatIcon } from '@components/icons/chat-icon';
import { PauseIcon } from '@components/icons/pause-icon';
import { TaskStatusIcon } from '@components/icons/task-status-icon';
// import { WatchIcon } from '@components/icons/watch-icon';
import { useAgent } from '@hooks/use-agent';
import { useAgentStore } from '@stores/agent-store';

export const WorkingAgentLayout = ({ agentId, agentData }: BaseAgentLayoutProps) => {
    const { getAgentData } = useAgentStore();
    const data = agentData || getAgentData(agentId);
    const [result, setResult] = useState('');
    const hasExecuted = useRef(false);
    const { transition } = useAgentStore();
    const { executeAction, pauseExecution, isProcessing } = useAgent(agentId, status => {
        transition(agentId, status);
    });

    // Start execution when component mounts, but only once
    useEffect(() => {
        if (hasExecuted.current) return;

        (async () => {
            console.log('🚀 Working agent mounted, executing action...');
            hasExecuted.current = true;
            setResult(await executeAction());
        })();
        // This needs to run only once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePause = async () => {
        await pauseExecution();
    };

    return (
        <div className="working-agent-card">
            <div className="working-agent-wrapper">
                {/* Content */}
                <div className="agent-info-section">
                    <Image src={data?.image || cloudHeadImage}
                        alt={`Profile avatar of ${data?.name}`}
                        className="rounded-full"
                        width={48}
                        height={48} />
                    <div className="agent-name">
                        <span>{data?.name}</span>
                    </div>
                </div>

                {/* Status section */}
                <div className="agent-tasks-section">
                    <div className="agent-tasks-title">
                        <TaskStatusIcon />
                        <span>Current Task:</span>
                    </div>
                    <div className="agent-tasks-container">
                        <p>{isProcessing ? 'Processing...' : result || 'Ready'}</p>
                    </div>
                </div>
                <div className="buttons-container">
                    <Button customStyles={{ textColor: '#7d829a', backgroundColor: '#232629' }}
                        variant="primary"
                        size="sm"
                        radius="lg"
                        fullWidth
                        disabled={isProcessing}
                        onClick={handlePause}
                        icon={<PauseIcon width={15} height={15} />}>
                        Pause
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
