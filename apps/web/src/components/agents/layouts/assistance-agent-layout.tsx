import Image from 'next/image';

import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { BaseAgentLayoutProps } from './base-agent-layout';
import { ChatIcon } from '@components/icons/chat-icon';
import { HandIcon } from '@components/icons/hand-icon';
import { NotificationBellIcon } from '@components/icons/notification-bell-icon';
import { WatchIcon } from '@components/icons/watch-icon';
import { AgentState } from '@app-types/agent';

export const AssistanceAgentLayout = ({ data, agent, onAssistanceRequest }: BaseAgentLayoutProps) => {
    return (
        <div className="assistance-card" onClick={onAssistanceRequest}>
            {agent?.state === AgentState.Assistance && (
                <div className="hand-icon-container absolute right-2 top-1/2 -translate-y-1/2">
                    <HandIcon
                        width={44} // ~2.76863rem
                        height={50} // ~3.14456rem
                        fillColor="white" />
                </div>
            )}

            <div className="agent-header">
                <div className="agent-avatar">
                    <Image src={data.image || cloudHeadImage} alt="Cloud head avatar" width={48} height={48} />
                </div>
                <div className="agent-title">
                    <h3>{data.role}</h3>
                    <h3>{data.name}</h3>
                </div>
            </div>

            <div className="agent-status">
                <span className="status-label">
                    <NotificationBellIcon width={15} height={15} color="#BEC1CE" />
                    Status:
                </span>
                <span className="status-value">Stuck, please help</span>
            </div>

            <div className="assistance-message-container">
                {/*{data?.assistanceMessage && (*/}
                <div className="message-box">
                    {/*<p>{data.assistanceMessage}</p>*/}
                    <p>Can&apos;t find a button. Something is blocking progression.</p>
                </div>
            </div>

            <div className="action-buttons">
                <button className="button help-button">
                    <WatchIcon width={15} height={15} strokeColor="#7D829A" />
                    Help
                </button>
                <button className="button action-button">
                    <ChatIcon width={15} height={15} />
                </button>
            </div>
        </div>
    );
};
