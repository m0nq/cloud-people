import Image from 'next/image';

import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { BaseAgentLayoutProps } from './base-agent-layout';
import { Button } from '@components/utils/button/button';
import { ChatIcon } from '@components/icons/chat-icon';
import { TaskStatusIcon } from '@components/icons/task-status-icon';
import { WatchIcon } from '@components/icons/watch-icon';

export const WorkingAgentLayout = ({ data }: BaseAgentLayoutProps) => {
    return (
        <div className="working-agent-card">
            {/* Background blobs */}
            <div className="background-blobs">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
            </div>

            {/* Content */}
            <div className="agent-info-section">
                <Image src={data.image || cloudHeadImage}
                    alt={`Profile avatar of ${data.name}`}
                    className="rounded-full"
                    width={48}
                    height={48} />
                <div className="agent-name">
                    <span>{data.role}</span>
                    <span>{data.name}</span>
                </div>
            </div>

            {/* Status section */}
            <div className="agent-tasks-section">
                <div className="agent-tasks-title">
                    <TaskStatusIcon />
                    <span>Current Task:</span>
                </div>
                <div className="agent-tasks-container">
                    <p>Name of task</p>
                </div>
            </div>
            <div className="buttons-container">
                <Button customStyles={{ textColor: '#7d829a', backgroundColor: '#232629' }}
                    variant="primary"
                    size="sm"
                    radius="lg"
                    fullWidth
                    icon={<WatchIcon />}>
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
    );
};
