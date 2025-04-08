import { ReactNode } from 'react';
import { MessageSquareIcon } from '@components/icons/message-square-icon';
import { useThemeStore } from '@stores/theme-store';
import './node.styles.css';

type CloudJesusNodeProps = {
    data: {
        id: string;
        label: string;
        description?: string;
        iconColor?: string;
    };
};

const CloudJesusNode = ({ data }: CloudJesusNodeProps): ReactNode => {
    const { isDarkMode } = useThemeStore();

    const handleClick = () => {
        // Open chat with Cloud Jesus
        alert('Cloud Jesus is here to help! Chat functionality coming soon.');
    };

    return (
        <div 
            className="cloud-jesus-node nodrag"
            onClick={handleClick}
        >
            <div className="message-header">
                <div className="agent-info">
                    <div className="agent-avatar">
                        <MessageSquareIcon width={24} height={24} stroke={data.iconColor || '#e879f9'} />
                    </div>
                    <span className="agent-name">{data.label}</span>
                </div>
                <div className="online-status">
                    <span className="status-dot"></span>
                    <span className="status-text">Online</span>
                </div>
            </div>
            <div className="message-content">
                <div className="message">
                    <p>{data.description}</p>
                </div>
            </div>
            <div className="message-input">
                <input 
                    type="text" 
                    placeholder="Type your message..." 
                    onClick={(e) => e.stopPropagation()}
                    readOnly
                />
            </div>
        </div>
    );
};

export default CloudJesusNode;
