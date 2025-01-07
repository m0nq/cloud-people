import Image from 'next/image';
import { CSSProperties } from 'react';
import { ReactNode } from 'react';

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
    children: ReactNode;
}

export const BaseAgentLayout = ({
    data,
    state,
    className = '',
    style,
    onEdit
}: BaseAgentLayoutProps) => {
    return (
        <div className={`agent-card-container ${className}`} style={style}>
            {/*<div className="flex items-center justify-between mb-4">*/}
            <div className="">
                <div className="agent-runner-title">
                    <Image
                        src={cloudHeadImage}
                        alt={`Profile avatar of ${data.name}`}
                        className="w-12 h-12 rounded-full" />
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-900">{data.name}</h3>
                        <p className="text-sm text-gray-600">{data.role}</p>
                    </div>
                </div>
                {state?.isEditable && onEdit && (
                    <button onClick={onEdit}
                        className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                        Edit
                    </button>
                )}
            </div>
            <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Core Skill:</p>
                <p className="text-sm text-gray-600">TikTok Trend Analysis</p>
            </div>
        </div>
    );
};
