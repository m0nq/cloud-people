import Image from 'next/image';

import cloudHeadImage from '@public/pink-cloud-head.png';
import { BaseAgentLayoutProps } from './base-agent-layout';
import { PlayIcon } from '@components/icons/play-icon';
import { useAgentStore } from '@stores/agent-store';

export const CompleteAgentLayout = ({ agentId }: BaseAgentLayoutProps) => {
    const { getAgentData } = useAgentStore();
    const data = getAgentData(agentId);

    return (
        <div className="complete-agent-card">
            <div className="header-section">
                <div className="avatar-container">
                    <Image src={data?.image || cloudHeadImage} alt="Cloud head avatar" width={48} height={48} />
                </div>
                <div className="info-container">
                    <div className="name-section">
                        <h3>{data?.name}</h3>
                    </div>
                    <div className="status-section">
                        <span className="status-label">Status:</span>
                        <span className="status-value">Waiting Review</span>
                    </div>
                </div>
            </div>
            <button className="review-button">
                <PlayIcon width={28} height={28} />
                <span>Review Summary</span>
            </button>
        </div>
    );
};
