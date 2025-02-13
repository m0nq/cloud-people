import Image from 'next/image';
import { ReactNode } from 'react';
import { CSSProperties } from 'react';

import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { InfoIcon } from '@components/icons/info-icon';
import { RefreshIcon } from '@components/icons/refresh-icon';
import { TargetIcon } from '@components/icons/target-icon';
import { DocumentIcon } from '@components/icons/document-icon';
import { AgentData } from '@app-types/agent';
import { AgentState } from '@app-types/agent';

export type BaseAgentLayoutProps = {
    data: AgentData;
    state?: AgentState;
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

export const BaseAgentLayout = ({ data, className = '', style, tools = [] }: BaseAgentLayoutProps): ReactNode => {
    return (
        <div className={`agent-card-base ${className}`} style={style}>
            <div className="agent-title-section">
                <Image src={data.image || cloudHeadImage} alt={`Profile avatar of ${data.name}`} className="avatar" />
                <div className="agent-name">
                    <h3>{data.role}</h3>
                    <h3>{data.name}</h3>
                </div>
                <div className="info-icon-button">
                    <InfoIcon color="#575D69" strokeWidth={2} />
                </div>
            </div>

            <div className="core-skills-section">
                <p className="skill-label">Core Skills</p>
                <div className="skill-value">Making Interface</div>
            </div>

            <div className="stats-section">
                <p className="stat-label">Stats</p>
                <div className="stat-item-container">
                    <div className="stat-item">
                        <RefreshIcon width={19} height={19} />
                        342
                    </div>
                    <div className="stat-item">
                        <TargetIcon width={19} height={19} />
                        83%
                    </div>
                    <div className="stat-item">
                        <DocumentIcon width={20} height={21} />
                        1.3k
                    </div>
                </div>
            </div>

            <div className="agent-tools-section">
                <p className="tool-label">Tools</p>
                <div className="tool-item-container">
                    {tools.slice(0, 2).map(tool => (
                        <div key={tool.id} className="tool-item" title={tool.name}>
                            {/* Placeholder circle - will be replaced with actual tool icon */}
                            <div className="w-4 h-4 rounded-full bg-gray-500" />
                        </div>
                    ))}
                    {tools.length > 2 && <div className="more-tools">+{tools.length - 2}</div>}
                    {/* Show empty circles if no tools provided */}
                    {tools.length === 0 && (
                        <>
                            <div className="tool-item">
                                <div className="tool-item-placeholder" />
                                <p>Figma</p>
                            </div>
                            <div className="tool-item">
                                <div className="tool-item-placeholder" />
                                <p>Dribble</p>
                            </div>
                            <div className="more-tools">+2</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
