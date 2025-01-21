import Image from 'next/image';

import './agent-card.styles.css';
import cloudHeadImage from '@public/pink-cloud-head.png';
import { BaseAgentLayoutProps } from './base-agent-layout';
import { NotificationBellIcon } from '@components/icons/notification-bell-icon';
import { WatchIcon } from '@components/icons/watch-icon';
import { ChatIcon } from '@components/icons/chat-icon';

export const AssistanceAgentLayout = ({ data, state, onAssistanceRequest }: BaseAgentLayoutProps) => {
    return (
        <div className="assistance-card">
            <div className="agent-header">
                <div className="agent-avatar">
                    <Image src={data.image || cloudHeadImage}
                        alt="Cloud People Avatar"
                        width={48}
                        height={48} />
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
                {/*{state?.assistanceMessage && (*/}
                <div className="message-box">
                    {/*<p>{state.assistanceMessage}</p>*/}
                    <p>Can't find a button. Something is blocking progression.</p>
                </div>
                {/*)}*/}
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
