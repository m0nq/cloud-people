import Image from 'next/image';

import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { BaseAgentLayoutProps } from './base-agent-layout';
import { Button } from '@components/utils/button/button';
import { PenIcon } from '@components/icons/pen-icon';
import { ChatIcon } from '@components/icons/chat-icon';
import { useAgentStore } from '@stores/agent-store';

export const IdleAgentLayout = ({ agentId}: BaseAgentLayoutProps) => {
    const { getAgentData } = useAgentStore();
    const data = getAgentData(agentId);

    return (
        <div className="idle-agentState-card">
            <div className="content-container">
                <div className="idle-agentState-info-section">
                    <Image src={data?.image || cloudHeadImage}
                        alt={`Profile avatar of ${data?.name}`}
                        className="rounded-full"
                        width={48}
                        height={48} />
                    <div className="agentState-name">
                        <p>{data?.name}</p>
                    </div>
                </div>
                <div className="idle-agentState-status-section">
                    <div className="status-label">
                        Status:
                    </div>
                    <div className="status-value">
                        Standing by...
                    </div>
                </div>
                <div className="idle-agentState-tools-section">
                    <div className="tools-indicator-container">
                        <div className="indicator" />
                        <div className="indicator" />
                        <div className="indicator" />
                    </div>
                </div>
                <div className="buttons-container">
                    <Button customStyles={{ textColor: '#7d829a', backgroundColor: '#232629' }}
                        variant="primary"
                        size="sm"
                        radius="lg"
                        fullWidth
                        icon={<PenIcon />}>
                        Edit
                    </Button>
                    <Button variant="secondary"
                        size="sm"
                        radius="lg"
                        customStyles={{ textColor: '#2F3338', backgroundColor: '#56e8cd' }}
                        fullWidth
                        icon={<ChatIcon />}>
                        Meeting
                    </Button>
                </div>
            </div>
        </div>
    );
};
