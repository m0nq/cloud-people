import Image from 'next/image';
import { ReactNode } from 'react';
import { CSSProperties } from 'react';

import './agent-card.styles.css';
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
                <div className="flex items-center mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-star text-yellow-500 mr-1">
                        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                    </svg>
                    <span className="text-xs text-gray-400">92% accuracy</span></div>
            </div>
        </div>
    );
};
