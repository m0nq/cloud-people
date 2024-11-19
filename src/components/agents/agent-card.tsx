'use client';
import Image from 'next/image';

import './agent-card.styles.css';
import ricoResearcherImage from '@public/rico-researcher.png';

type AgentCardProps = {
    data: {
        name: string;
        role: string;
    };
}

export const AgentCard = ({ data }: AgentCardProps) => {
    return (
        <div className="agent-card-container">
            <div>
                <div className="agent-runner-title">
                    <Image src={ricoResearcherImage} alt={`Profile avatar of ${data.name}`} className="avatar" />
                    <div className="agent-name">
                        <h3>{data.name}</h3>
                        <h3>{data.role}</h3>
                    </div>
                    {/* conditional edit &/or price icon */}
                </div>
                <div className="runner-description">
                    <p>Core Skill:</p>
                    <p>TikTok Trend Analysis</p>
                </div>
            </div>
            {/* conditional: */}
            {/* list of app icons runner uses */}
            {/* prompt text box */}
            {/* training hours section */}
            {/* status */}
            <div className="agent-runner-status">
                <p>Standing by</p>
                <div className="status-complete-info">
                    <p>Completed on</p>
                    {/* optional completed date */}
                    <p>1/24 @ 11:33</p>
                </div>
            </div>
        </div>
    );
};
