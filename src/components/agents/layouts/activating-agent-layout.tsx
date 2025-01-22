import Image from 'next/image';

import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { BaseAgentLayoutProps } from './base-agent-layout';

export const ActivatingAgentLayout = ({ data }: BaseAgentLayoutProps) => {
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
