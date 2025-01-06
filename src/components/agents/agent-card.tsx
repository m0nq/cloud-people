import Image from 'next/image';
import { CSSProperties } from 'react';

import './agent-card.styles.css';
import ricoResearcherImage from '@public/rico-researcher.png';
import { AgentState } from '@lib/definitions';
import { AgentStatus } from '@lib/definitions';

type AgentCardProps = {
    data: {
        name: string;
        role: string;
    };
    state?: AgentState;
    className?: string;
    style?: CSSProperties;
    onEdit?: () => void;
    onAssistanceRequest?: () => void;
    onRestart?: () => void;
};

export const AgentCard = ({
    data,
    state,
    className = '',
    style,
    onEdit,
    onAssistanceRequest,
    onRestart
}: AgentCardProps) => {
    const getStatusText = (status?: AgentStatus) => {
        switch (status) {
            case AgentStatus.Initial:
                return 'Ready to Start';
            case AgentStatus.Idle:
                return 'Standing By';
            case AgentStatus.Activating:
                return 'Activating...';
            case AgentStatus.Working:
                return 'In Progress';
            case AgentStatus.Error:
                return 'Error';
            case AgentStatus.Assistance:
                return 'Needs Assistance';
            case AgentStatus.Complete:
                return 'Completed';
            default:
                return 'Standing By';
        }
    };

    return (
        <div className={`agent-card-container ${className}`} style={style}>
            <div>
                <div className="agent-runner-title">
                    <Image src={ricoResearcherImage} alt={`Profile avatar of ${data.name}`} className="avatar" />
                    <div className="agent-name">
                        <h3>{data.name}</h3>
                        <h3>{data.role}</h3>
                    </div>
                    {state?.isEditable && onEdit && (
                        <button onClick={onEdit} className="edit-button">
                            Edit
                        </button>
                    )}
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
                <p>{getStatusText(state?.status)}</p>
                {state?.error && (
                    <div className="error-message">
                        <p>{state.error}</p>
                        {onRestart && (
                            <button onClick={onRestart} className="restart-button">
                                Restart
                            </button>
                        )}
                    </div>
                )}
                {state?.assistanceMessage && (
                    <div className="assistance-message">
                        <p>{state.assistanceMessage}</p>
                        {onAssistanceRequest && (
                            <button onClick={onAssistanceRequest} className="assist-button">
                                Provide Assistance
                            </button>
                        )}
                    </div>
                )}
                {state?.status === AgentStatus.Complete && state.completedAt && (
                    <div className="status-complete-info">
                        <p>Completed on</p>
                        <p>{state.completedAt}</p>
                    </div>
                )}
                {state?.progress && (
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${state.progress}%` }} />
                    </div>
                )}
            </div>
        </div>
    );
};
