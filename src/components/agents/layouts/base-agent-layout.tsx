import Image from 'next/image';
import { CSSProperties } from 'react';

import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { AgentData } from '@lib/definitions';
import { AgentState } from '@lib/definitions';
import { InfoIcon } from '@/components/icons/info-icon';

export interface BaseAgentLayoutProps {
    data: AgentData;
    state?: AgentState;
    className?: string;
    style?: CSSProperties;
    tools?: { id: string; name: string }[];
    onEdit?: () => void;
    onAssistanceRequest?: () => void;
    onRestart?: () => void;
}

export const BaseAgentLayout = ({ data, className = '', style, tools = [] }: BaseAgentLayoutProps) => {
    return (
        <div className={`agent-card-base ${className}`} style={style}>
            <div className="agent-title-section">
                <Image src={cloudHeadImage} alt={`Profile avatar of ${data.name}`} className="avatar" />
                <div className="agent-name">
                    <h3>{data.role}</h3>
                    <h3>{data.name}</h3>
                </div>
                <div className="info-icon-button">
                    <InfoIcon color="#575D69" strokeWidth={2} />
                </div>
            </div>

            <div className="core-skills">
                <p className="skill-label">Core Skills</p>
                <div className="skill-value">Making Interface</div>
            </div>

            <div className="stats">
                <div className="stat-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 3.5V12.5M8 12.5L12.5 8M8 12.5L3.5 8" stroke="currentColor" strokeLinecap="round"
                            strokeLinejoin="round" />
                    </svg>
                    342
                </div>
                <div className="stat-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path d="M8 5.5V8.5L10 10.5" stroke="currentColor" strokeLinecap="round"
                            strokeLinejoin="round" />
                    </svg>
                    83%
                </div>
                <div className="stat-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M13 8.5V12.5C13 13.0523 12.5523 13.5 12 13.5H3.5C2.94772 13.5 2.5 13.0523 2.5 12.5V4C2.5 3.44772 2.94772 3 3.5 3H7.5"
                            stroke="currentColor"
                            strokeLinecap="round"
                        />
                        <path d="M10 2.5H13.5V6" stroke="currentColor" strokeLinecap="round" />
                        <path d="M6.5 9.5L13.5 2.5" stroke="currentColor" strokeLinecap="round" />
                    </svg>
                    1.3k
                </div>
            </div>

            <div className="tools">
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
                            <div className="w-4 h-4 rounded-full bg-gray-500" />
                        </div>
                        <div className="tool-item">
                            <div className="w-4 h-4 rounded-full bg-gray-500" />
                        </div>
                        <div className="more-tools">+2</div>
                    </>
                )}
            </div>
        </div>
    );
};
