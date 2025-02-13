import { useEffect } from 'react';
import Image from 'next/image';

import { AgentStatus } from '@app-types/agent';
import { useAgentStore } from '@stores/agent-store';
import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { BaseAgentLayoutProps } from './base-agent-layout';

export const ActivatingAgentLayout = ({ data }: BaseAgentLayoutProps) => {
    const { transition } = useAgentStore();

    useEffect(() => {
        // Will do further set up here as needed
        // Transition to Working state after 3 seconds
        const timer = setTimeout(() => {
            transition(data.id, AgentStatus.Working);
        }, 3000);

        return () => clearTimeout(timer);
    }, [data.id, transition]);

    return (
        <div className="activating-agent-card">
            <Image src={data.image || cloudHeadImage}
                alt={`Profile avatar of ${data.name}`}
                className="avatar"
                width={48}
                height={48} />
            <div className="agent-info-section">
                <div className="status-content activating">
                    <span className="status-label">Activating</span>
                </div>
                <div className="agent-name">
                    <p>{data.role}</p>
                    <p>{data.name}</p>
                </div>
            </div>
        </div>
    );
};
