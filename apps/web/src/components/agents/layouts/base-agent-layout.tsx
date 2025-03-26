import Image from 'next/image';
import { ReactNode } from 'react';
import { CSSProperties } from 'react';

import './agent-card.styles.css';
import { StarIcon } from '@components/icons';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { useAgentStore } from '@stores/agent-store';
import { useThemeStore } from '@stores/theme-store';
import type { AgentData } from '@app-types/agent';

export type BaseAgentLayoutProps = {
    agentId: string;
    agentData?: AgentData;  // Optional direct data prop
    className?: string;
    style?: CSSProperties;
    onEdit?: () => void;
    onAssistanceRequest?: () => void;
    onRestart?: () => void;
    isLoading?: boolean;
    isProcessing?: boolean;
    onExecute?: () => void;
    tools?: { id: string; name: string }[];
};

export const BaseAgentLayout = ({
    agentId,
    agentData,  // New prop
    className = '',
    style,
    tools = []
}: BaseAgentLayoutProps): ReactNode => {
    const { getAgentData } = useAgentStore();
    const { isDarkMode } = useThemeStore();
    // Use provided data or fall back to store data
    const data = agentData || getAgentData(agentId);

    return (
        <div className={`agent-card-base-theme ${className}`} data-theme={isDarkMode ? 'dark' : 'light'} style={style}>
            <div className="agent-title-section">
                <Image src={data?.image || cloudHeadImage}
                    alt={`Profile avatar of ${data?.name || 'Agent'}`}
                    className="avatar" />
                <div className="agent-name">
                    <h3>{data?.name}</h3>
                    <p>Research Specialist</p>
                </div>
                {/*<div className="info-icon-button">*/}
                {/*    <InfoIcon color="#575D69" strokeWidth={2} />*/}
                {/*</div>*/}
            </div>

            <div className="core-skills-section">
                {/* list of skills will go here */}
                <div className="skill-value">Data Analysis</div>
                <div className="skill-value">Research</div>
                <div className="skill-value">Report Writing</div>
            </div>

            <div className="stats-section">
                <div className="stat-item-container">
                    <StarIcon />
                    <span className="stat-item">92% accuracy</span></div>
            </div>
        </div>
    );
};
