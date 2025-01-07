import { BaseAgentLayout } from './base-agent-layout';
import { BaseAgentLayoutProps } from './base-agent-layout';

export const IdleAgentLayout = (props: BaseAgentLayoutProps) => {
    return (
        <div className="agent-card-container idle">
            <BaseAgentLayout {...props} />
            <div className="agent-runner-status">
                <div className="status-content idle">
                    <span className="status-label">Standing By</span>
                </div>
            </div>
        </div>
    );
};
