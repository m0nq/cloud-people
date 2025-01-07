import './agent-card.styles.css';

import { BaseAgentLayoutProps } from './base-agent-layout';
import { BaseAgentLayout } from './base-agent-layout';

export const WorkingAgentLayout = (props: BaseAgentLayoutProps) => {
    const { state } = props;

    return (
        <div className="agent-card-container working">
            <BaseAgentLayout {...props} />
            <div className="agent-runner-status">
                <div className="status-content">
                    <span className="text-sm font-medium text-blue-600">In Progress</span>
                    {state?.progress && (
                        <span className="text-sm text-gray-600">{state.progress}%</span>
                    )}
                </div>
                {state?.progress && (
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${state.progress}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
