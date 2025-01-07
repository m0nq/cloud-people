import Image from 'next/image';
import { CSSProperties } from 'react';

import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { AgentData } from '@lib/definitions';
import { AgentState } from '@lib/definitions';

export interface BaseAgentLayoutProps {
    data: AgentData;
    state?: AgentState;
    className?: string;
    style?: CSSProperties;
    onEdit?: () => void;
    onAssistanceRequest?: () => void;
    onRestart?: () => void;
}

export const BaseAgentLayout = ({
    data,
    state,
    className = '',
    style,
    onEdit
}: BaseAgentLayoutProps) => {
    return (
        <div className={`agent-card-base ${className}`} style={style}>
            <div className="agent-runner-title">
                <Image
                    src={cloudHeadImage}
                    alt={`Profile avatar of ${data.name}`}
                    className="avatar" />
                <div className="agent-name">
                    <h3>{data.name}</h3>
                    <p className="text-sm text-gray-600">{data.role}</p>
                </div>
                {state?.isEditable && onEdit && (
                    <button onClick={onEdit}
                        className="edit-button">
                        Edit
                    </button>
                )}
            </div>
            <div className="runner-description">
                <p>Core Skill:</p>
                <p>TikTok Trend Analysis</p>
            </div>
        </div>
    );
};
