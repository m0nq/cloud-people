import { useEffect } from 'react';
import Image from 'next/image';

import { AgentState } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';
import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { BaseAgentLayoutProps } from './base-agent-layout';

export const ActivatingAgentLayout = ({ agentId }: BaseAgentLayoutProps) => {
    const { transition } = useAgentStore();
    const { getAgentData } = useAgentStore();
    const data = getAgentData(agentId);

    useEffect(() => {
        // Will do further set up here as needed
        // Transition to Working state after 3 seconds
        const timer = setTimeout(() => {
            transition(agentId, AgentState.Working);
        }, 3000);

        return () => clearTimeout(timer);
    }, [agentId, transition]);

    return (
        <div className="activating-agent-card">
            <Image src={cloudHeadImage}
                alt={`Profile avatar of ${data?.name}`}
                className="avatar"
                width={48}
                height={48} />
            <div className="agentState-info-section">
                <div className="status-content activating">
                    <span className="status-label">Activating</span>
                </div>
                <div className="agentState-name">
                    <p>{data?.name}</p>
                </div>
            </div>
        </div>
    );
};
